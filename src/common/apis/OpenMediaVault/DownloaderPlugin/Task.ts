import { ApiBuilder, BaseRequest } from "../shared";

// https://github.com/openmediavault/openmediavault/blob/master/deb/openmediavault/debian/openmediavault.openmediavault.default#L36
const UUID_TOKEN = "fa4b1c66-ef79-11e5-87a0-0002b3a176b4";
const SERVICE_NAME = "Downloader";

export interface DownloaderPluginTaskListRequest extends BaseRequest {
  start?: number;
  limit?: number;
}

export interface DownloaderPluginTaskListResponse {
  total: number;
  data: DownloaderPluginTask[];
}

export const __taskNormalStatuses = {
  downloading: true,
  seeding: true,
  error: true,
  finished: true,
  waiting: true,
};

export type DownloaderPluginTaskNormalStatus = keyof typeof __taskNormalStatuses;
export const ALL_TASK_NORMAL_STATUSES = Object.keys(
  __taskNormalStatuses,
) as DownloaderPluginTaskNormalStatus[];

export const __taskErrorStatuses = {
  unknown: true,
};

export type DownloaderPluginTaskErrorStatus = keyof typeof __taskErrorStatuses;
export const ALL_TASK_ERROR_STATUSES = Object.keys(
  __taskErrorStatuses,
) as DownloaderPluginTaskErrorStatus[];

export enum DownloaderPluginTaskDlType {
  ARIA2 = "aria2",
  CURL = "curl",
  YTDL = "youtube-dl",
}

// noinspection SpellCheckingInspection
export interface DownloaderPluginTask {
  uuid: string;
  filename: string;
  url: string;
  dltype?: DownloaderPluginTaskDlType;
  downloading: boolean;
  filesize: number;
  parts?: number;
  format?: string;
  keepvideo?: string;
  subtitles?: boolean;
  sharedfoldername?: string;
  sharedfolderref: string;
  delete?: boolean;
}

export interface DownloaderPluginTaskCreateRequest extends BaseRequest {
  filename: string;
  url: string;
  dltype: DownloaderPluginTaskDlType;
  sharedfolderref: string;
  subtitles: boolean;
  delete: boolean;
  parts?: number;
  format?: string;
}

export interface DownloaderPluginTaskByIdRequest extends BaseRequest {
  uuid: string;
}
export interface DownloaderPluginTaskStartResponse {
  data: string;
}

const taskBuilder = new ApiBuilder(SERVICE_NAME);

export const Task = {
  SERVICE_NAME: SERVICE_NAME,

  List: taskBuilder.makePost<DownloaderPluginTaskListRequest, DownloaderPluginTaskListResponse>(
    "getDownloadList",
    (o) => ({ limit: -1, start: 0, ...o }),
    (o) => o,
    true,
  ),
  Create: taskBuilder.makePost<DownloaderPluginTaskCreateRequest, DownloaderPluginTask>(
    "setDownload",
    (o) => ({ ...o, uuid: UUID_TOKEN }),
    (r) => r,
  ),
  Start: taskBuilder.makePost<DownloaderPluginTaskByIdRequest, DownloaderPluginTaskStartResponse>(
    "doDownloadBg",
    (o) => o,
    (o) => o,
  ),
  Delete: taskBuilder.makePost<DownloaderPluginTaskByIdRequest, DownloaderPluginTask>(
    "deleteDownload",
    (o) => o,
    (o) => o,
  ),
};
