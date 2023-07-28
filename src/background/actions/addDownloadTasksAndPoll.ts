import { OMVClient, ClientRequestResult } from "../../common/apis/OpenMediaVault";
import { getErrorForFailedResponse } from "../../common/apis/errors";
import { saveLastSevereError } from "../../common/errorHandlers";
import { assertNever } from "../../common/lang";
import { notify } from "../../common/notify";
import { ALL_DOWNLOADABLE_PROTOCOLS } from "../../common/apis/protocols";
import { resolveUrl, ResolvedUrl, sanitizeUrlForSynology, guessFileNameFromUrl } from "./urls";
import { pollTasks } from "./pollTasks";
import type { UnionByDiscriminant } from "../../common/types";
import type { AddTaskOptions } from "../../common/apis/messages";
import type { RequestManager } from "../requestManager";
import { DownloaderPluginTaskDlType } from "../../common/apis/OpenMediaVault/DownloaderPlugin/Task";

type ArrayifyValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K][];
};

type ResolvedUrlByType = ArrayifyValues<UnionByDiscriminant<ResolvedUrl, "type">>;

const hardcoreOpt = {
  dltype: DownloaderPluginTaskDlType.ARIA2,
  format: "",
  parts: 20,
  subtitles: false,
  delete: false,
};

function reportUnexpectedError(
  notificationId: string | undefined,
  e: any | undefined,
  debugMessage?: string,
) {
  saveLastSevereError(e, debugMessage);
  notify(
    browser.i18n.getMessage("Failed_to_add_download"),
    browser.i18n.getMessage("Unexpected_error_please_check_your_settings_and_try_again"),
    "failure",
    notificationId,
  );
}

function getFileNameFromUrl(url: string): string {
  return url.split("/").pop()?.split("?")[0].split("#")[0] || "";
}

async function addOneTask(
  api: OMVClient,
  pollRequestManager: RequestManager,
  showNonErrorNotifications: boolean,
  url: string,
  { path }: AddTaskOptions,
) {
  async function reportTaskAddResult(
    result: ClientRequestResult<unknown>,
    filename: string | undefined,
  ) {
    console.log("task add result", result);

    if (ClientRequestResult.isConnectionFailure(result)) {
      notify(
        browser.i18n.getMessage("Failed_to_connect_to_DiskStation"),
        browser.i18n.getMessage("Please_check_your_settings"),
        "failure",
        notificationId,
      );
    } else if (result.success) {
      if (showNonErrorNotifications) {
        notify(
          browser.i18n.getMessage("Download_added"),
          filename || url,
          "success",
          notificationId,
        );
      }
    } else {
      notify(
        browser.i18n.getMessage("Failed_to_add_download"),
        getErrorForFailedResponse(result),
        "failure",
        notificationId,
      );
    }
  }

  const notificationId = showNonErrorNotifications
    ? notify(browser.i18n.getMessage("Adding_download"), guessFileNameFromUrl(url) ?? url)
    : undefined;

  const resolvedUrl = await resolveUrl(url, undefined, undefined);

  if (resolvedUrl.type === "direct-download") {
    try {
      const fUrl = resolvedUrl.url.toString();
      const result = await api.DownloaderPlugin.Task.Create({
        url: fUrl,
        filename: getFileNameFromUrl(fUrl),
        sharedfolderref: path,
        ...hardcoreOpt,
      });
      await reportTaskAddResult(result, guessFileNameFromUrl(url));
      await pollTasks(api, pollRequestManager);
    } catch (e) {
      reportUnexpectedError(notificationId, e, "error while adding direct-download task");
    }
  } else if (resolvedUrl.type === "metadata-file") {
    try {
      console.log("metadata-file moment");
    } catch (e) {
      reportUnexpectedError(notificationId, e, "error while adding metadata-file task");
    }
  } else if (resolvedUrl.type === "missing-or-illegal") {
    notify(
      browser.i18n.getMessage("Failed_to_add_download"),
      browser.i18n.getMessage("URL_must_start_with_one_of_ZprotocolsZ", [
        ALL_DOWNLOADABLE_PROTOCOLS.join(", "),
      ]),
      "failure",
      notificationId,
    );
  } else {
    assertNever(resolvedUrl);
  }
}

async function addMultipleTasks(
  api: OMVClient,
  pollRequestManager: RequestManager,
  showNonErrorNotifications: boolean,
  urls: string[],
  { path }: AddTaskOptions,
) {
  const notificationId = showNonErrorNotifications
    ? notify(
        browser.i18n.getMessage("Adding_ZcountZ_downloads", [urls.length]),
        browser.i18n.getMessage("Please_be_patient_this_may_take_some_time"),
      )
    : undefined;

  const resolvedUrls = await Promise.all(urls.map((url) => resolveUrl(url, undefined, undefined)));

  const groupedUrls: ResolvedUrlByType = {
    "direct-download": [],
    "metadata-file": [],
    "missing-or-illegal": [],
  };

  resolvedUrls.forEach((url) => {
    (groupedUrls[url.type] as typeof url[]).push(url);
  });

  let successes = 0;
  let failures = 0;

  function countResults(result: ClientRequestResult<unknown>, count: number) {
    console.log("task add result", result);

    if (ClientRequestResult.isConnectionFailure(result)) {
      failures += count;
    } else if (result.success) {
      successes += count;
    } else if (!result.success) {
      failures += count;
    } else {
      assertNever(result);
    }
  }

  failures += groupedUrls["missing-or-illegal"].length;

  if (groupedUrls["direct-download"].length > 0) {
    const urls = groupedUrls["direct-download"].map(({ url }) => sanitizeUrlForSynology(url));
    const results = urls.map((u) => {
      const fUrl = u.toString();
      return api.DownloaderPlugin.Task.Create({
        url: fUrl,
        filename: getFileNameFromUrl(fUrl),
        sharedfolderref: path,
        ...hardcoreOpt,
      });
    });
    await Promise.all(
      results.map(async (r) => {
        try {
          countResults(await r, 1);
        } catch (e) {
          failures += 1;
          saveLastSevereError(e, "error while a adding a direct-download URL");
        }
      }),
    );
  }

  if (groupedUrls["metadata-file"].length > 0) {
    console.log("metadata-file moment");
  }

  if (successes > 0 && failures === 0) {
    notify(
      browser.i18n.getMessage("ZcountZ_downloads_added", [successes]),
      undefined,
      "success",
      notificationId,
    );
  } else if (successes === 0 && failures > 0) {
    notify(
      browser.i18n.getMessage("Failed_to_add_ZcountZ_downloads", [failures]),
      browser.i18n.getMessage(
        "Try_adding_downloads_individually_andor_checking_your_URLs_or_settings",
      ),
      "failure",
      notificationId,
    );
  } else {
    notify(
      browser.i18n.getMessage("ZsuccessZ_downloads_added_ZfailedZ_failed", [successes, failures]),
      browser.i18n.getMessage(
        "Try_adding_downloads_individually_andor_checking_your_URLs_or_settings",
      ),
      "failure",
      notificationId,
    );
  }

  void pollTasks(api, pollRequestManager);
}

export async function addDownloadTasksAndPoll(
  api: OMVClient,
  pollRequestManager: RequestManager,
  showNonErrorNotifications: boolean,
  options: AddTaskOptions,
): Promise<void> {
  if (options.urls.length === 0) {
    notify(
      browser.i18n.getMessage("Failed_to_add_download"),
      browser.i18n.getMessage("No_downloadable_URLs_provided"),
      "failure",
    );
  } else if (options.urls.length === 1) {
    await addOneTask(api, pollRequestManager, showNonErrorNotifications, options.urls[0], options);
  } else {
    await addMultipleTasks(
      api,
      pollRequestManager,
      showNonErrorNotifications,
      options.urls,
      options,
    );
  }
}
