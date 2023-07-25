import { default as sortBy } from "lodash/sortBy";
import { default as partition } from "lodash/partition";
import {
  DownloadStationTask,
  DownloadStationTaskNormalStatus,
  DownloadStationTaskErrorStatus,
  ALL_TASK_ERROR_STATUSES,
  ALL_TASK_NORMAL_STATUSES,
} from "../common/apis/synology/DownloadStation/Task";
import type { VisibleTaskSettings, TaskSortType } from "./state";
import { assertNever, recordKeys } from "./lang";

const EXPLICIT_TASK_FILTER_TO_NORMAL_TYPES: {
  [K in "downloading" | "uploading" | "completed"]: DownloadStationTaskNormalStatus[];
} = {
  downloading: ["downloading", "extracting", "finishing", "hash_checking"],
  uploading: ["seeding"],
  completed: ["finished"],
};

{
  // Compile-time unit test.
  const _1: keyof VisibleTaskSettings = (null as any) as keyof typeof EXPLICIT_TASK_FILTER_TO_NORMAL_TYPES;
  _1;
}

const EXPLICITLY_SPECIFIED_TYPES = recordKeys(EXPLICIT_TASK_FILTER_TO_NORMAL_TYPES).reduce(
  (acc, key) => acc.concat(EXPLICIT_TASK_FILTER_TO_NORMAL_TYPES[key]),
  [] as DownloadStationTaskNormalStatus[],
);

const ERRORED_TYPES = (ALL_TASK_ERROR_STATUSES as (
  | DownloadStationTaskNormalStatus
  | DownloadStationTaskErrorStatus
)[]).concat(["error"]);

const OTHER_STATUSES = ALL_TASK_NORMAL_STATUSES.filter(
  (status) =>
    EXPLICITLY_SPECIFIED_TYPES.indexOf(status) === -1 && ERRORED_TYPES.indexOf(status) === -1,
);

const TASK_FILTER_TO_TYPES: Record<
  keyof VisibleTaskSettings,
  (DownloadStationTaskNormalStatus | DownloadStationTaskErrorStatus)[]
> = {
  ...EXPLICIT_TASK_FILTER_TO_NORMAL_TYPES,
  errored: ERRORED_TYPES,
  other: OTHER_STATUSES,
};

export function matchesFilter(task: DownloadStationTask, filterName: keyof VisibleTaskSettings) {
  const status = task.downloading ? 'downloading' : (task.filesize > 0)  ? 'finished' : 'waiting';
  return TASK_FILTER_TO_TYPES[filterName].indexOf(status) !== -1;
}

export function filterTasks(
  tasks: DownloadStationTask[],
  visibleTasks: VisibleTaskSettings,
  showInactiveTasks: boolean,
) {
  return tasks.filter(
    (t) =>
      ((visibleTasks.downloading && matchesFilter(t, "downloading")) ||
        (visibleTasks.uploading && matchesFilter(t, "uploading")) ||
        (visibleTasks.completed && matchesFilter(t, "completed")) ||
        (visibleTasks.errored && matchesFilter(t, "errored")) ||
        (visibleTasks.other && matchesFilter(t, "other"))) &&
      (showInactiveTasks || isActive(t)),
  );
}

function isActive(task: DownloadStationTask) {
  return task.downloading;
}

// function fractionComplete(task: DownloadStationTask) {
//   return task.additional!.transfer!.size_downloaded / task.size;
// }

export function sortTasks(
  tasks: DownloadStationTask[],
  taskSortType: TaskSortType,
): DownloadStationTask[] {
  switch (taskSortType) {
    case "name-asc":
      return sortBy(tasks, (t) => t.filename.toLocaleLowerCase());

    case "name-desc":
      return sortBy(tasks, (t) => t.filename.toLocaleLowerCase()).reverse();

    case "timestamp-completed-asc": {
      const [completed, incomplete] = partition(
        tasks,
        (t) => matchesFilter(t, "completed") || matchesFilter(t, "uploading"),
      );
      // return [
      //   ...sortBy(incomplete, (t) => -fractionComplete(t)),
      //   ...sortBy(completed, (t) => t.additional!.detail!.completed_time),
      // ];
      return [
        ...sortBy(incomplete, (t) => t),
        ...sortBy(completed, (t) => t),
      ];
    }

    case "timestamp-completed-desc": {
      const [completed, incomplete] = partition(
        tasks,
        (t) => matchesFilter(t, "completed") || matchesFilter(t, "uploading"),
      );
      // return [
      //   ...sortBy(incomplete, (t) => -fractionComplete(t)),
      //   ...sortBy(completed, (t) => -t.additional!.detail!.completed_time),
      // ];
      return [
        ...sortBy(incomplete, (t) => t),
        ...sortBy(completed, (t) => t),
      ];
    }

    case "timestamp-added-asc":
      return sortBy(tasks, (t) => t);

    case "timestamp-added-desc":
      return sortBy(tasks, (t) => t).reverse();

    case "completed-percent-asc":
      return sortBy(sortTasks(tasks, "name-asc"), 0);

    case "completed-percent-desc":
      return sortBy(sortTasks(tasks, "name-desc"), 0).reverse();

    default:
      return assertNever(taskSortType);
  }
}
