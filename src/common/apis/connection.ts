import { ConnectionSettings, getHostUrl } from "../state";
import { ClientRequestResult, SessionName, OMVClient } from "./OpenMediaVault";

export async function testConnection(settings: ConnectionSettings) {
  const api = new OMVClient({
    baseUrl: getHostUrl(settings),
    username: settings.username,
    password: settings.password,
    session: SessionName.DOWNLOADER_PLUGIN,
  });

  const loginResult = await api.Auth.Login({ _timeout: 30000 });
  if (
    !ClientRequestResult.isConnectionFailure(loginResult) &&
    loginResult.success &&
    loginResult.data.authenticated
  ) {
    // Note that this is fire-and-forget.
    api.Auth.Logout({ _timeout: 10000 }).then((logoutResponse) => {
      if (logoutResponse === "not-logged-in") {
        // Typescript demands we handle this case, which is correct, but also, it's pretty wat
        console.error(`wtf: not logged in immediately after successfully logging in`);
      } else if (
        ClientRequestResult.isConnectionFailure(logoutResponse) ||
        !logoutResponse.success
      ) {
        console.error(
          "ignoring unexpected failure while logging out after successful connection test",
          logoutResponse,
        );
      }
    });
  }

  return loginResult;
}
