import type { ConnectionFailure, RpcFailureResponse } from "./OpenMediaVault";
import { assertNever } from "../lang";

const ERROR_CODES: Record<string, Record<string | number, string>> = {
  http: {
    100: browser.i18n.getMessage("Unknown_error"),
    404: browser.i18n.getMessage("The_requested_method_does_not_exist"),
    403: browser.i18n.getMessage("The_logged_in_session_does_not_have_permission"),
    406: browser.i18n.getMessage(
      "No_default_destination_is_set_in_Download_Station_for_this_Synology_user",
    ),
  },
  login: {
    "Incorrect username or password.": browser.i18n.getMessage(
      "No_such_username_or_incorrect_password",
    ),
  },
  deleteDownload: {
    "[REGEX] uuid: The value '.+?' is not an UUIDv4.": browser.i18n.getMessage("Invalid_task_ID"),
  },
  Downloader: {
    "[REGEX] The method '.+?' does not exist for the RPC service 'Downloader'.": browser.i18n.getMessage(
      "Invalid_task_action",
    ),
  },
};

export function getErrorForFailedResponse(
  response: RpcFailureResponse,
  defaultMessage: string = "Unknown error.",
): string {
  console.info(`[ERROR RESPONSE]: `, response);

  const methodErrorCodes = ERROR_CODES[response._meta.method];
  const serviceErrorCodes = ERROR_CODES[response._meta.service];

  let methodErrorCode = findByKeyAndRegex(methodErrorCodes, response.error.message);
  let serviceErrorCode =
    serviceErrorCodes[response.error.code] ||
    findByKeyAndRegex(serviceErrorCodes, response.error.message);

  return (
    methodErrorCode ??
    serviceErrorCode ??
    ERROR_CODES.http[response.error.code] ??
    response.error.message ??
    defaultMessage
  );
}

export function getErrorForConnectionFailure(failure: ConnectionFailure) {
  switch (failure.type) {
    case "missing-config":
      return browser.i18n.getMessage("Connection_settings_are_not_configured");
    case "probable-wrong-protocol":
      return browser.i18n.getMessage("Connection_failed_Likely_cause_wrong_protocol");
    case "probable-wrong-url-or-no-connection-or-cert-error":
      return browser.i18n.getMessage(
        "Connection_failed_Likely_cause_wrong_hostnameport_no_internet_connection_or_invalid_certificate",
      );
    case "timeout":
      return browser.i18n.getMessage(
        "Connection_timed_out_Check_your_hostnameport_settings_and_internet_connection",
      );
    case "unknown":
      return browser.i18n.getMessage("Connection_failed_for_an_unknown_reason");
    default:
      return assertNever(failure);
  }
}

function findByKeyAndRegex(record: Record<string, string>, probKey: string): string | undefined {
  const value = record[probKey];

  if (!value) {
    const probKeyByRegex = Object.keys(record).find(
      (k) => k.startsWith("[REGEX]") && new RegExp(k.slice(8)).test(probKey),
    );
    if (probKeyByRegex) {
      return record[probKeyByRegex];
    }
  }
  return value;
}
