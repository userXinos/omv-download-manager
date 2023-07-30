import { typesafeUnionMembers } from "../../lang";
import { Auth, AuthLoginResponse } from "./Auth";
import { DownloaderPlugin } from "./DownloaderPlugin";
import { ShareMgmt } from "./ShareMgmt";
import {
  SessionName,
  RpcResponse,
  RpcFailureResponse,
  BaseRequest,
  BadResponseError,
  TimeoutError,
  NetworkError,
} from "./shared";

export interface OMVClientSettings {
  baseUrl: string;
  username: string;
  password: string;
  session: SessionName;
}

const SETTING_NAME_KEYS = typesafeUnionMembers<keyof OMVClientSettings>({
  baseUrl: true,
  username: true,
  password: true,
  session: true,
});

export type ConnectionFailure =
  | {
      type: "missing-config";
      which: "password" | "other";
    }
  | {
      type:
        | "probable-wrong-protocol"
        | "probable-wrong-url-or-no-connection-or-cert-error"
        | "timeout"
        | "unknown";
      error: any;
    };

function isConnectionFailure(v: OMVClientSettings | ConnectionFailure): v is ConnectionFailure {
  return (v as ConnectionFailure).type != null;
}

const ConnectionFailure = {
  from: (error: any): ConnectionFailure => {
    if (error instanceof BadResponseError && error.response.status === 400) {
      return { type: "probable-wrong-protocol", error };
    } else if (error instanceof NetworkError) {
      return { type: "probable-wrong-url-or-no-connection-or-cert-error", error };
    } else if (error instanceof TimeoutError) {
      return { type: "timeout", error };
    } else {
      return { type: "unknown", error };
    }
  },
};

export type ClientRequestResult<T> = RpcResponse<T> | ConnectionFailure;

export const ClientRequestResult = {
  isConnectionFailure: (result: ClientRequestResult<unknown>): result is ConnectionFailure => {
    return (
      (result as ConnectionFailure).type != null && (result as RpcResponse<unknown>).success == null
    );
  },
};

export class OMVClient {
  private loginPromise: Promise<ClientRequestResult<AuthLoginResponse>> | undefined;
  private settingsVersion: number = 0;

  constructor(private settings: Partial<OMVClientSettings>) {}

  public partiallyUpdateSettings(settings: Partial<OMVClientSettings>) {
    const updatedSettings = { ...this.settings, ...settings };
    if (SETTING_NAME_KEYS.some((k) => updatedSettings[k] !== this.settings[k])) {
      this.settingsVersion++;
      this.settings = updatedSettings;
      void this.maybeLogout();
      return true;
    } else {
      return false;
    }
  }

  private getValidatedSettings(): OMVClientSettings | ConnectionFailure {
    const missingFields = SETTING_NAME_KEYS.filter((k) => {
      const v = this.settings[k];
      return v == null;
    });
    if (missingFields.length === 0) {
      return this.settings as OMVClientSettings;
    } else {
      return {
        type: "missing-config",
        which: missingFields.length === 1 && missingFields[0] === "password" ? "password" : "other",
      };
    }
  }

  private maybeLogin = async (request?: BaseRequest) => {
    const settings = this.getValidatedSettings();
    if (isConnectionFailure(settings)) {
      return settings;
    } else if (!this.loginPromise) {
      const { baseUrl, ...restSettings } = settings;
      this.loginPromise = Auth.Login(baseUrl, {
        ...request,
        ...restSettings,
      }).catch((e) => ConnectionFailure.from(e));
    }

    return this.loginPromise;
  };

  // [Sean Kelley]:
  // Note that this method is the BEST EFFORT.
  // (1) Because the client auto-re-logs in when you make new queries, this method will attempt to
  //     only log out the current session. The next non-logout call is guaranteed to attempt to log
  //     back in.
  // (2) The result of this call, either success or failure, has no bearing on future API calls. It
  //     is provided to the caller only for convenience, and may not reflect the true state of the
  //     client or session at the time the promise is resolved.
  private maybeLogout = async (
    request?: BaseRequest,
  ): Promise<ClientRequestResult<{}> | "not-logged-in"> => {
    const stashedLoginPromise = this.loginPromise;
    const settings = this.getValidatedSettings();
    this.loginPromise = undefined;

    if (!stashedLoginPromise) {
      return "not-logged-in" as const;
    } else if (isConnectionFailure(settings)) {
      return settings;
    } else {
      const response = await stashedLoginPromise;
      if (ClientRequestResult.isConnectionFailure(response)) {
        return response;
      } else if (response.success && response.data.authenticated) {
        try {
          return await Auth.Logout(settings.baseUrl, { ...request });
        } catch (e) {
          return ConnectionFailure.from(e);
        }
      } else {
        return response;
      }
    }
  };

  public Auth = {
    Login: this.maybeLogin,
    Logout: this.maybeLogout,
  };

  private proxy<T, U>(
    fn: (baseUrl: string, options: T) => Promise<RpcResponse<U>>,
  ): (options: T) => Promise<ClientRequestResult<U>> {
    const wrappedFunction = async (
      options: T,
      shouldRetryRoutineFailures: boolean = true,
    ): Promise<ClientRequestResult<U>> => {
      const versionAtInit = this.settingsVersion;

      const maybeLogoutAndRetry = async (
        result: ConnectionFailure | RpcFailureResponse,
      ): Promise<ClientRequestResult<U>> => {
        // TODO handle login errors here
        if (shouldRetryRoutineFailures && ClientRequestResult.isConnectionFailure(result)) {
          this.loginPromise = undefined;
          return wrappedFunction(options, false);
        } else {
          return result;
        }
      };

      try {
        // [Sean Kelley]:
        // `await`s in this block aren't necessary to adhere to the type signature, but it changes
        // who's responsible for handling the errors. Currently, errors unhandled by lower levels
        // are bubbled up to this outermost `catch`.

        const loginResult = await this.maybeLogin();

        if (this.settingsVersion !== versionAtInit) {
          return await wrappedFunction(options);
        } else if (ClientRequestResult.isConnectionFailure(loginResult) || !loginResult.success) {
          return await maybeLogoutAndRetry(loginResult);
        } else {
          const response = await fn(this.settings.baseUrl!, options);

          if (this.settingsVersion !== versionAtInit) {
            return await wrappedFunction(options);
          } else if (response.success) {
            return response;
          } else {
            return await maybeLogoutAndRetry(response);
          }
        }
      } catch (e) {
        return ConnectionFailure.from(e);
      }
    };

    return wrappedFunction;
  }

  private proxyOptionalArgs<T, U>(
    fn: (baseUrl: string, options?: T) => Promise<RpcResponse<U>>,
  ): (options?: T) => Promise<ClientRequestResult<U>> {
    return this.proxy(fn);
  }

  public DownloaderPlugin = {
    Task: {
      List: this.proxy(DownloaderPlugin.Task.List),
      Create: this.proxy(DownloaderPlugin.Task.Create),
      Start: this.proxy(DownloaderPlugin.Task.Start),
      Delete: this.proxy(DownloaderPlugin.Task.Delete),
    },
    Info: {
      Get: this.proxyOptionalArgs(DownloaderPlugin.Info.Get),
    },
  };

  public ShareMgmt = {
    Folders: {
      list: this.proxyOptionalArgs(ShareMgmt.Folders.list),
    },
  };
}
