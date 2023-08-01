import { getHostUrl, ConnectionSettings } from "../common/state";
import { MessageResponse, AddTaskOptions, SetLoginPassword } from "../common/apis/messages";
import { AddTasks, StartTask, DeleteTasks, ListDirectories } from "../common/apis/messages";
import { ClientRequestResult } from "../common/apis/OpenMediaVault";
import { testConnection } from "../common/apis/connection";
import type { ShareMgmtFolder } from "../common/apis/OpenMediaVault/ShareMgmt/Folders";

export interface PopupClient {
  openDownloadStationUi: () => void;
  createTasks: (options: AddTaskOptions) => void;
  startTask: (taskId: string) => Promise<MessageResponse>;
  deleteTasks: (taskIds: string[]) => Promise<MessageResponse>;
  listDirectories: (path?: string) => Promise<MessageResponse<ShareMgmtFolder[]>>;
  testConnectionAndLogin: (password: string) => Promise<ClientRequestResult<{}>>;
}

export function getClient(settings: ConnectionSettings): PopupClient | undefined {
  const hostUrl = getHostUrl(settings);
  if (hostUrl) {
    return {
      openDownloadStationUi: () => {
        void browser.tabs.create({
          url: hostUrl + "/#/services/downloader",
          active: true,
        });
      },
      createTasks: AddTasks.send,
      startTask: StartTask.send,
      deleteTasks: DeleteTasks.send,
      listDirectories: ListDirectories.send,
      testConnectionAndLogin: async (password: string) => {
        const result = await testConnection({ ...settings, password });
        if (!ClientRequestResult.isConnectionFailure(result) && result.success) {
          await SetLoginPassword.send(password);
        }
        return result;
      },
    };
  } else {
    return undefined;
  }
}
