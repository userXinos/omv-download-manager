import { ClientRequestResult } from "../common/apis/OpenMediaVault";
import { getErrorForConnectionFailure, getErrorForFailedResponse } from "../common/apis/errors";
import { Message, MessageResponse, Result } from "../common/apis/messages";
import { addDownloadTasksAndPoll, clearCachedTasks, pollTasks } from "./actions";
import { BackgroundState, getMutableStateSingleton } from "./backgroundState";
import type { DiscriminateUnion } from "../common/types";
import { onStoredStateChange, State } from "../common/state";

type MessageHandler<T extends Message, U extends Result[keyof Result]> = (
  m: T,
  state: BackgroundState,
) => Promise<U>;

type MessageHandlers = {
  [T in Message["type"]]: MessageHandler<DiscriminateUnion<Message, "type", T>, Result[T]>;
};

function toMessageResponse(response: ClientRequestResult<unknown>): MessageResponse;
function toMessageResponse<T, U>(
  response: ClientRequestResult<T>,
  extract: (result: T) => U,
): MessageResponse<U>;
function toMessageResponse<T, U>(
  response: ClientRequestResult<T>,
  extract?: (result: T) => U,
): MessageResponse<U> {
  if (ClientRequestResult.isConnectionFailure(response)) {
    return {
      success: false,
      reason: getErrorForConnectionFailure(response),
    };
  } else if (!response.success) {
    return {
      success: false,
      reason: getErrorForFailedResponse(response),
    };
  } else {
    return {
      success: true,
      // [Sean Kelley]:
      // Non-null assert: extract exists iff we are type-parameterized to something other than undefined.
      result: extract?.(response.data)!,
    };
  }
}

const MESSAGE_HANDLERS: MessageHandlers = {
  "add-tasks": (m, state) => {
    return addDownloadTasksAndPoll(
      state.api,
      state.pollRequestManager,
      state.showNonErrorNotifications,
      m.options,
    );
  },
  "poll-tasks": (_m, state) => {
    return pollTasks(state.api, state.pollRequestManager);
  },
  "start-task": async (m, state) => {
    return toMessageResponse(await state.api.DownloaderPlugin.Task.Start({ uuid: m.taskId }));
  },
  "delete-tasks": async (m, state) => {
    const ids = m.taskIds.map((uuid) => state.api.DownloaderPlugin.Task.Delete({ uuid }));
    const response = toMessageResponse(await Promise.all(ids).then((r) => r[0]));

    if (response.success) {
      await pollTasks(state.api, state.pollRequestManager);
    }
    return response;
  },
  "list-directories": async (_m, state) => {
    return toMessageResponse(await state.api.ShareMgmt.Folders.list(), (r) => r);
  },
  "set-login-password": async (m, state) => {
    if (state.api.partiallyUpdateSettings({ password: m.password })) {
      await clearCachedTasks();
    }
    // Always reset the session!

    await state.api.Auth.Logout();
  },
  "set-color-scheme": async ({ color }) => {
    onStoredStateChange((state) => {
      state.settings.prefersColorScheme = color;
      void browser.storage.local.set<Partial<State>>({ settings: state.settings });
    });
  },
};

export function initializeMessageHandler() {
  browser.runtime.onMessage.addListener((m) => {
    if (Message.is(m)) {
      return MESSAGE_HANDLERS[m.type](m as any, getMutableStateSingleton());
    } else {
      console.error("received unhandleable message", m);
      return undefined;
    }
  });
}
