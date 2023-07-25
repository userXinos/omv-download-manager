import { RestApiResponse, BaseRequest, post, SessionName } from "./shared";
import { deleteAllCookies } from '../../deleteAllCookies';

const CGI_NAME = "auth";
const API_NAME = "SYNO.API.Auth";

export interface AuthLoginRequest extends BaseRequest {
  account: string;
  passwd: string;
  session: SessionName;
  // 2 is the lowest version that actually provides an sid.
  // 3 is the lowest version that DSM 7 supports.
  version: 2 | 3;
}

export interface AuthLoginResponse {
  authenticated: boolean;
  permissions: { role: 'admin'|'user' };
  username: string
}

export interface AuthLogoutRequest extends BaseRequest {
  session: SessionName;
  params: null;
}

function Login(
  baseUrl: string,
  options: AuthLoginRequest,
): Promise<RestApiResponse<AuthLoginResponse>> {
  return post(baseUrl, CGI_NAME, {
    ...options,
    api: API_NAME,
    format: "sid",

    method: "login",
    service: 'session',
    params: {
      username: options.account,
      password: options.passwd,
    },
    meta: {
      apiGroup: "Auth",
    },
  })
      .then((res) => {
        res.success = (res.data as AuthLoginResponse).authenticated;
        return res as RestApiResponse<AuthLoginResponse>;
      });
}

function Logout(baseUrl: string, options: AuthLogoutRequest): Promise<RestApiResponse<{}>> {
  return post(baseUrl, CGI_NAME, {
    ...options,
    api: API_NAME,
    version: 1,

    method: "logout",
    service: 'session',
    params: null,
    meta: {
      apiGroup: "Auth",
    },
  })
      .then((res) => {
        deleteAllCookies();
        return res as RestApiResponse<{}>
      })
}

export const Auth = {
  API_NAME,
  Login,
  Logout,
};
