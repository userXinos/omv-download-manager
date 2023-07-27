import { ApiBuilder, BaseRequest, RestApiResponse, post } from "../shared";

// https://github.com/openmediavault/openmediavault/blob/master/deb/openmediavault/debian/openmediavault.openmediavault.default#L36
const UUID_TOKEN = "fa4b1c66-ef79-11e5-87a0-0002b3a176b4";

export type DownloadStationTaskAdditionalType = "detail" | "transfer" | "file" | "tracker" | "peer";

export interface DownloadStationTaskListRequest extends BaseRequest {
  offset?: number;
  limit?: number;
  additional?: DownloadStationTaskAdditionalType[];
}

export interface DownloadStationDataListResponse {
  total: number;
  data: DownloadStationTask[];
}

export interface DownloadStationTaskListResponse {
  total: number;
  tasks: DownloadStationTask[];
}

export interface DownloadStationTaskDetail {
  completed_time: number;
  connected_leechers: number;
  connected_peers: number;
  connected_seeders: number;
  create_time: number;
  destination: string;
  seedelapsed: number;
  started_time: number;
  total_peers: number;
  total_pieces: number;
  unzip_password: string;
  uri: string;
  waiting_seconds: number;
}

export interface DownloadStationTaskFile {
  filename: string;
  index: number;
  priority: "skip" | "low" | "normal" | "high";
  size: number;
  size_downloaded: number;
  wanted: boolean;
}

export interface DownloadStationTaskPeer {
  address: string;
  agent: string;
  progress: number;
  speed_download: number;
  speed_upload: number;
}

export interface DownloadStationTaskTracker {
  peers: number;
  seeds: number;
  status: string;
  update_timer: number;
  url: string;
}

export interface DownloadStationTaskTransfer {
  downloaded_pieces: number;
  size_downloaded: number;
  size_uploaded: number;
  speed_download: number;
  speed_upload: number;
}

export const __taskNormalStatuses = {
  downloading: true,
  error: true,
  extracting: true,
  filehosting_waiting: true,
  finished: true,
  finishing: true,
  hash_checking: true,
  paused: true,
  seeding: true,
  waiting: true,
};

export type DownloadStationTaskNormalStatus = keyof typeof __taskNormalStatuses;
export const ALL_TASK_NORMAL_STATUSES = Object.keys(
  __taskNormalStatuses,
) as DownloadStationTaskNormalStatus[];

export const __taskErrorStatuses = {
  broken_link: true,
  destination_denied: true,
  destination_not_exist: true,
  disk_full: true,
  encrypted_name_too_long: true,
  exceed_max_destination_size: true,
  exceed_max_file_system_size: true,
  exceed_max_temp_size: true,
  extract_failed_disk_full: true,
  extract_failed_invalid_archive: true,
  extract_failed_quota_reached: true,
  extract_failed_wrong_password: true,
  extract_failed: true,
  file_not_exist: true,
  ftp_encryption_not_supported_type: true,
  missing_python: true,
  name_too_long: true,
  not_supported_type: true,
  private_video: true,
  quota_reached: true,
  required_premium_account: true,
  encryption: true,
  timeout: true,
  torrent_duplicate: true,
  try_it_later: true,
  unknown: true,
};

export type DownloadStationTaskErrorStatus = keyof typeof __taskErrorStatuses;
export const ALL_TASK_ERROR_STATUSES = Object.keys(
  __taskErrorStatuses,
) as DownloadStationTaskErrorStatus[];

export enum DownloadStationTaskDLTYPE {
  ARIA2 = "aria2",
  CURL = "curl",
  YTDL = "youtube-dl",
}

export interface DownloadStationTask {
  uuid: string;
  filename: string;
  url: string;
  dltype: DownloadStationTaskDLTYPE;
  downloading: boolean;
  filesize: number;
  parts: number;
  format: string;
  keepvideo: string;
  subtitles: boolean;
  sharedfoldername: string;
  sharedfolderref: string;
  delete: boolean;
}

export interface DownloadStationTaskGetInfoRequest extends BaseRequest {
  id: string[];
  additional?: DownloadStationTaskAdditionalType[];
}

export interface DownloadStationTaskGetInfoResponse {
  tasks: DownloadStationTask[];
}

export interface DownloadStationTaskCreateRequest extends BaseRequest {
  params: DownloadStationTaskCreateRequestParams;
}

export interface DownloadStationTaskCreateRequestParams extends Record<string, unknown> {
  filename: DownloadStationTask["filename"];
  url: DownloadStationTask["url"];
  dltype: DownloadStationTask["dltype"];
  parts?: DownloadStationTask["parts"];
  format?: DownloadStationTask["format"];
  sharedfolderref: DownloadStationTask["sharedfolderref"];
  subtitles: DownloadStationTask["subtitles"];
  delete: DownloadStationTask["delete"];
}

export interface DownloadStationTaskDeleteRequest extends BaseRequest {
  uuid: DownloadStationTask["uuid"];
}

export type DownloadStationTaskActionResponse = {
  id: string;
  error: number;
}[];

export interface DownloadStationTaskPauseResumeRequest extends BaseRequest {
  id: string[];
}

export interface DownloadStationTaskEditRequest extends BaseRequest {
  id: string[];
  destination?: string;
}

const CGI_NAME = "DownloadStation/task";
const API_NAME = "Downloader";

const taskBuilder = new ApiBuilder(CGI_NAME, API_NAME, {
  apiGroup: "DownloadStation",
  apiSubgroup: "DownloadStation.Task",
});

function Task_Create(
  baseUrl: string,
  options: DownloadStationTaskCreateRequest,
): Promise<RestApiResponse<{}>> {
  const commonOptions = {
    ...options,
    service: API_NAME,
    version: 1,
    method: "setDownload",
    meta: {
      apiGroup: "DownloadStation",
      apiSubgroup: "DownloadStation.Task",
    },
  };
  commonOptions.params.uuid = UUID_TOKEN;

  return post(baseUrl, CGI_NAME, {
    ...commonOptions,
  });
}

export const Task = {
  API_NAME,
  List: taskBuilder.makePost<DownloadStationTaskListRequest, DownloadStationDataListResponse>(
    "getDownloadList",
    { limit: -1, start: 0 },
    (o) => ({
      ...o,
      additional: o?.additional?.length ? o.additional.join(",") : undefined,
    }),
    (r) => ({ ...r, tasks: r.data }),
    true,
  ),
  // GetInfo: taskBuilder.makeGet<
  //   DownloadStationTaskGetInfoRequest,
  //   DownloadStationTaskGetInfoResponse
  // >("getinfo", (o) => ({
  //   ...o,
  //   id: o.id.join(","),
  //   additional: o?.additional?.length ? o.additional.join(",") : undefined,
  // })),
  Create: Task_Create,
  Delete: taskBuilder.makePost<DownloadStationTaskDeleteRequest, DownloadStationTaskActionResponse>(
    "deleteDownload",
    {},
    (o) => ({ ...o, params: { uuid: o.uuid } }),
  ),
  // Pause: taskBuilder.makeGet<
  //   DownloadStationTaskPauseResumeRequest,
  //   DownloadStationTaskActionResponse
  // >("pause", (o) => ({ ...o, id: o.id.join(",") })),
  // Resume: taskBuilder.makeGet<
  //   DownloadStationTaskPauseResumeRequest,
  //   DownloadStationTaskActionResponse
  // >("resume", (o) => ({ ...o, id: o.id.join(",") })),
  // Edit: taskBuilder.makeGet<DownloadStationTaskEditRequest, DownloadStationTaskActionResponse>(
  //   "edit",
  //   (o) => ({ ...o, id: o.id.join(",") }),
  // ),
};
