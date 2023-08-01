import { ApiBuilder, BaseRequest } from "../shared";

const SERVICE_NAME = "ShareMgmt";

export interface ShareMgmtFoldersListRequest extends BaseRequest {}

// noinspection SpellCheckingInspection
export interface ShareMgmtFolder {
  uuid: string;
  mntentref: string;
  name: string;
  description: string;
  reldirpath: string;
}

export interface ShareMgmtFoldersListResponse {
  data: ShareMgmtFolder[];
}

const listBuilder = new ApiBuilder(SERVICE_NAME);

export const Folders = {
  SERVICE_NAME: SERVICE_NAME,

  list: listBuilder.makePost<ShareMgmtFoldersListRequest, ShareMgmtFolder[]>(
    "enumerateSharedFolders",
    (o) => o,
    (o) => o,
    true,
  ),
};
