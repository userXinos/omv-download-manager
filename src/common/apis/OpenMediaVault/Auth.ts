import { RpcResponse, BaseRequest, post } from "./shared";
import { deleteAllCookies } from "../../deleteAllCookies";

export interface AuthLoginRequest extends BaseRequest {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  authenticated: boolean;
  username: string;
  permissions: { role: "admin" | "user" };
}

export interface AuthLogoutRequest extends BaseRequest {}

const SERVICE_NAME = "session";

function Login(
  baseUrl: string,
  options: AuthLoginRequest,
): Promise<RpcResponse<AuthLoginResponse>> {
  const { _timeout, _credentials, ...params } = options;

  return post(baseUrl, {
    method: "login",
    service: SERVICE_NAME,
    _timeout,
    _credentials,
    params: { ...params },
  });
}

function Logout(baseUrl: string, options: AuthLogoutRequest): Promise<RpcResponse<{}>> {
  const { _timeout, _credentials, ...params } = options;

  return post(baseUrl, {
    method: "logout",
    service: SERVICE_NAME,
    _timeout,
    _credentials,
    params: { ...params },
  }).then((res) => {
    deleteAllCookies();
    return res as RpcResponse<{}>;
  });
}

export const Auth = {
  Login,
  Logout,
};
