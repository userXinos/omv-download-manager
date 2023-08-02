// noinspection ES6PreferShortImport
import type { Settings, State } from "./migrations/latest";
import { typesafeUnionMembers } from "../lang";

export const SETTING_NAMES = typesafeUnionMembers<keyof Settings>({
  connection: true,
  visibleTasks: true,
  taskSortType: true,
  notifications: true,
  shouldHandleDownloadLinks: true,
  badgeDisplayType: true,
  showInactiveTasks: true,
  prefersColorScheme: true,
});

const ALL_STORED_STATE_NAMES = typesafeUnionMembers<keyof State>({
  settings: true,
  tasks: true,
  taskFetchFailureReason: true,
  tasksLastInitiatedFetchTimestamp: true,
  tasksLastCompletedFetchTimestamp: true,
  lastSevereError: true,
  stateVersion: true,
});

async function fetchStateAndNotify(listeners: ((state: State) => void)[]) {
  const state = await browser.storage.local.get<State>(ALL_STORED_STATE_NAMES);
  listeners.forEach((l) => l(state));
}

let stateListeners: ((state: State) => void)[] = [];

let didAttachSingletonListener = false;

function attachSharedStateListener() {
  if (!didAttachSingletonListener) {
    didAttachSingletonListener = true;
    browser.storage.onChanged.addListener((_changes: StorageChangeEvent<State>, areaName) => {
      if (areaName === "local") {
        void fetchStateAndNotify(stateListeners);
      }
    });
  }
}

export function onStoredStateChange(listener: (state: State) => void) {
  attachSharedStateListener();
  stateListeners.push(listener);
  void fetchStateAndNotify([listener]);
}
