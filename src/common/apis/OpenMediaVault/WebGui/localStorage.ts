import { ApiBuilder, BaseRequest } from "../shared";

const SERVICE_NAME = "WebGui";

// noinspection SpellCheckingInspection
export interface WebGuiLocalStorageGetRequest extends BaseRequest {
  devicetype?: string
}

export interface WebGuiLocalStorageGetResponse {
  "prefers-color-scheme": "dark"|"light",
}

const listBuilder = new ApiBuilder(SERVICE_NAME);

export const LocalStorage = {
  SERVICE_NAME: SERVICE_NAME,

  get: listBuilder.makePost<WebGuiLocalStorageGetRequest, WebGuiLocalStorageGetResponse>(
    "getLocalStorageItems",
    (o) => ({devicetype: 'desktop', ...o}),
    (o) => o,
    true,
  ),
};
