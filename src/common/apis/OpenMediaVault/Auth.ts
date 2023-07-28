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
  return post(baseUrl, {
    method: "login",
    service: SERVICE_NAME,
    params: { ...options },
  });
}

function Logout(baseUrl: string, options: AuthLogoutRequest): Promise<RpcResponse<{}>> {
  return post(baseUrl, {
    method: "logout",
    service: SERVICE_NAME,
    params: { ...options },
  }).then((res) => {
    deleteAllCookies();
    return res as RpcResponse<{}>;
  });
}

export const Auth = {
  Login,
  Logout,
};
