// TODO: This should re-define the properties that are interesting on the type, otherwise
// this migration is not safe from changes made to the imported typed in the future.
import type { DownloaderPluginTask } from "../../apis/OpenMediaVault/DownloaderPlugin/Task";
import type { OmitStrict } from "../../types";

import {
  migrate as migrate_1,
  State as State_1,
  ConnectionSettings as ConnectionSettings_1,
  VisibleTaskSettings as VisibleTaskSettings_1,
  TaskSortType as TaskSortType_1,
} from "./1";

export { Protocol, VisibleTaskSettings, TaskSortType, ConnectionSettings } from "./1";

export interface NotificationSettings {
  enableFeedbackNotifications: boolean;
  enableCompletionNotifications: boolean;
  completionPollingInterval: number;
}

export interface Settings {
  connection: ConnectionSettings_1;
  visibleTasks: VisibleTaskSettings_1;
  taskSortType: TaskSortType_1;
  notifications: NotificationSettings;
  shouldHandleDownloadLinks: boolean;
}

export interface CachedTasks {
  tasks: DownloaderPluginTask[];
  taskFetchFailureReason: "missing-config" | { failureMessage: string } | null;
  tasksLastInitiatedFetchTimestamp: number | null;
  tasksLastCompletedFetchTimestamp: number | null;
}

export interface Logging {
  lastSevereError: any | undefined;
}

export interface StateVersion {
  stateVersion: 2;
}

export interface State extends Settings, CachedTasks, Logging, StateVersion {}

export function migrate(state: State_1): State {
  state = {
    ...migrate_1(null),
    ...state,
  };
  delete (state as OmitStrict<State_1, "cachedTasksVersion"> & { cachedTasksVersion?: unknown })
    .cachedTasksVersion;
  return {
    ...(state as OmitStrict<State_1, "cachedTasksVersion">),
    // Clear tasks as we changed the shape of the request.
    tasks: [],
    taskFetchFailureReason: null,
    tasksLastInitiatedFetchTimestamp: null,
    tasksLastCompletedFetchTimestamp: null,
    notifications: {
      enableFeedbackNotifications: true,
      enableCompletionNotifications: state.notifications.enabled,
      completionPollingInterval: state.notifications.pollingInterval,
    },
    lastSevereError: undefined,
    stateVersion: 2,
  };
}
