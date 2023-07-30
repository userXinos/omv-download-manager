import { PluginMgmt } from "../PluginMgmt";
import type { PluginMgmtListGetRequest } from "../PluginMgmt/List";

const SERVICE_NAME = "DownloaderInfo";

export const Info = {
  SERVICE_NAME: SERVICE_NAME,

  Get: (baseUrl: string, options?: PluginMgmtListGetRequest) =>
    PluginMgmt.List.get(baseUrl, { ...options, search: "Downloader" }),
};
