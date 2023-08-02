import type { DiscriminateUnion, OmitStrict } from "../types";
import type { ShareMgmtFolder } from "./OpenMediaVault/ShareMgmt/Folders";
import type { Settings } from "../state";

export interface SuccessMessageResponse<T> {
  success: true;
  // [Sean Kelley]:
  // This field must be mandatory; if it isn't, type inference at usage sites can be unsafe because
  // it is too lenient with structural matching. The generic constraint does nothing if you can always
  // just leave all (or in this case, only) constrained values out entirely.
  result: T;
}
export interface FailureMessageResponse {
  success: false;
  reason: string;
}

export type MessageResponse<T = undefined> = SuccessMessageResponse<T> | FailureMessageResponse;

export const MessageResponse = {
  is: (r: unknown | null | undefined): r is MessageResponse => {
    const m = r as MessageResponse | null | undefined;
    return m != null && (m.success || (!m.success && m.reason != null));
  },
};

export interface AddTasks {
  type: "add-tasks";
  options: AddTaskOptions;
}

export interface AddTaskOptions {
  path: string;
  urls: string[];
  //dltype: string;
  //format: string;
  //subtitles: boolean;
  //delete: boolean;
}

export interface PollTasks {
  type: "poll-tasks";
}

export interface StartTask {
  type: "start-task";
  taskId: string;
}

export interface DeleteTasks {
  type: "delete-tasks";
  taskIds: string[];
}

export interface ListDirectories {
  type: "list-directories";
}

export interface SetLoginPassword {
  type: "set-login-password";
  password: string;
}

export interface SetColorScheme {
  type: "set-color-scheme";
  color: Settings["prefersColorScheme"];
}

export type Message =
  | AddTasks
  | PollTasks
  | StartTask
  | DeleteTasks
  | ListDirectories
  | SetLoginPassword
  | SetColorScheme;

const MESSAGE_TYPES: Record<Message["type"], true> = {
  "add-tasks": true,
  "delete-tasks": true,
  "poll-tasks": true,
  "start-task": true,
  "list-directories": true,
  "set-login-password": true,
  "set-color-scheme": true,
};

export const Message = {
  is: (m: object | null | undefined): m is Message => {
    return (
      m != null && (m as any).type != null && MESSAGE_TYPES[(m as any).type as Message["type"]]
    );
  },
};

export type Result = {
  "add-tasks": void;
  "poll-tasks": void;
  "start-task": MessageResponse;
  "delete-tasks": MessageResponse;
  "list-directories": MessageResponse<ShareMgmtFolder[]>;
  "set-login-password": void;
  "set-color-scheme": void;
};

function makeMessageOperations<T extends Message["type"], U extends any[]>(
  type: T,
  payload = (..._args: U) => ({} as OmitStrict<DiscriminateUnion<Message, "type", T>, "type">),
) {
  return {
    send: (...args: U) => {
      return browser.runtime.sendMessage({
        type,
        ...payload(...args),
      }) as Promise<Result[T]>;
    },
    is: (m: object | null | undefined): m is DiscriminateUnion<Message, "type", T> => {
      return m != null && (m as any).type == type;
    },
  };
}

export const AddTasks = makeMessageOperations("add-tasks", (options: AddTaskOptions) => ({
  options,
}));

export const PollTasks = makeMessageOperations("poll-tasks");

export const StartTask = makeMessageOperations("start-task", (taskId: string) => ({
  taskId,
}));

export const DeleteTasks = makeMessageOperations("delete-tasks", (taskIds: string[]) => ({
  taskIds,
}));

export const ListDirectories = makeMessageOperations("list-directories");

export const SetLoginPassword = makeMessageOperations("set-login-password", (password: string) => ({
  password,
}));

export const SetColorScheme = makeMessageOperations(
  "set-color-scheme",
  (color: SetColorScheme["color"]) => ({ color }),
);

{
  // [Sean Kelley]:
  // Compile-time check to make sure that these two different types that have to match, do.
  // noinspection JSUnusedAssignment
  let _message: Message["type"] = (null as unknown) as keyof Result;
  let _result: keyof Result = (null as unknown) as Message["type"];

  // [Sean Kelley]:
  // Get the compiler to shut up. These lines don't necessarily catch type errors.
  _message = _result;
  _result = _message;
}
