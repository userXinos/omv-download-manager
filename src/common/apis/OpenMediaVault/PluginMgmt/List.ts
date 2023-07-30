import { ApiBuilder, BaseRequest } from "../shared";

const SERVICE_NAME = "Plugin";

export interface PluginMgmtListGetRequest extends BaseRequest {
  search: string;
  start?: number;
  limit?: number;
}

export interface PluginMgmt {
  abstract: string;
  name: string;
  installed: boolean;
  version: string;
}

export interface PluginMgmtListResponse {
  total: number;
  data: PluginMgmt[];
}

const listBuilder = new ApiBuilder(SERVICE_NAME);

export const List = {
  SERVICE_NAME: SERVICE_NAME,

  get: listBuilder.makePost<PluginMgmtListGetRequest, PluginMgmtListResponse>("getList", (o) => ({
    ...o,
    start: 0,
    limit: -1,
  })),
};
