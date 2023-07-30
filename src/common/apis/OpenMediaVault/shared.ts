const DEFAULT_TIMEOUT = 60000;

export class BadResponseError extends Error {
  constructor(public response: Response) {
    super();
  }
}
export class TimeoutError extends Error {}
export class NetworkError extends Error {}

export interface RpcParams {
  [p: string]: unknown;
}

export interface GroupMeta {
  service: string;
  method: string;
}

export interface RequestMeta extends GroupMeta {}

export interface ResponseMeta extends GroupMeta {}

export interface RpcSuccessResponse<S> {
  success: true;
  data: S;
  _meta: ResponseMeta;
}

export interface RpcFailureResponse {
  success: false;
  error: {
    code: number;
    message: string;
    trace: string;
  };
  _meta: ResponseMeta;
}

export type RpcResponse<S> = RpcSuccessResponse<S> | RpcFailureResponse;

export interface BaseRequest {
  _timeout?: number;
  _credentials?: "same-origin" | "include" | "omit";
}

export interface RpcRequest extends BaseRequest {
  method: string;
  service: string;
  params?: RpcParams | null;
  // _meta: RequestMeta;

  [key: string]: string | number | null | undefined | RpcParams | boolean;
}

async function fetchWithErrorHandling(
  url: string,
  init: RequestInit,
  timeout: number | undefined,
): Promise<unknown> {
  const abortController = new AbortController();
  const timeoutTimer = setTimeout(() => {
    abortController.abort();
  }, timeout ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      signal: abortController.signal,
      ...init,
    });
    if (!response.ok) {
      // response.error.code - useless (always zero),
      // OMV for localization uses sentences
      return {
        success: false,
        error: await response.json().then((r) => ({ ...r.error, code: response.status })),
      };
    } else {
      return {
        success: true,
        data: await response.json().then((r) => r.response),
      };
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new TimeoutError();
    } else if (e instanceof Error && /networkerror/i.test(e?.message)) {
      throw new NetworkError();
    } else {
      throw e;
    }
  } finally {
    clearTimeout(timeoutTimer);
  }
}

export async function post<O extends object>(
  baseUrl: string,
  request: RpcRequest,
): Promise<RpcResponse<O>> {
  const { _timeout, _credentials, ...body } = request;
  const url = `${baseUrl}/rpc.php`;
  const init = {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    credentials: _credentials,
    body: JSON.stringify({ ...body }),
  };
  const response = (await fetchWithErrorHandling(url, init, _timeout)) as Promise<RpcResponse<O>>;

  return {
    ...response,
    _meta: { method: body.method, service: body.service },
  };
}

export class ApiBuilder {
  constructor(private service: string) {}

  makePost<I extends BaseRequest, O>(
    methodName: string,
    preprocess?: (options: I) => object,
    postprocess?: (response: O) => O,
  ): (baseUrl: string, options: I) => Promise<RpcResponse<O>>;
  makePost<I extends BaseRequest, O>(
    methodName: string,
    preprocess: ((options: I) => object) | undefined,
    postprocess: ((response: O) => O) | undefined,
    optional: true,
  ): (baseUrl: string, options?: I) => Promise<RpcResponse<O>>;

  makePost(
    methodName: string,
    preprocess?: (options: object) => object,
    postprocess?: (response: object) => object,
    _optional?: true,
  ) {
    return this.makeApiRequest(post, methodName, preprocess, postprocess);
  }

  private makeApiRequest(
    method: typeof post,
    methodName: string,
    preprocess = (o: object) => o,
    postprocess = (o: object) => o,
  ) {
    return async (baseUrl: string, options?: RpcRequest) => {
      const { _timeout, ...params } = options || { params: {} };

      const response = await method(baseUrl, {
        params: { ...preprocess!(params) },
        method: methodName,
        service: this.service,
        _timeout,
      });
      if (response.success) {
        return { ...response, data: postprocess!(response.data) };
      } else {
        return response;
      }
    };
  }
}
