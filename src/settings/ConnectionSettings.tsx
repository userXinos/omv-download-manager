import "./connection-settings.scss";

import * as React from "react";
import { default as uniqueId } from "lodash/uniqueId";

import type { ConnectionSettings as ConnectionSettingsObject } from "../common/state";
import { ClientRequestResult } from "../common/apis/OpenMediaVault";
import { SettingsList } from "../common/components/SettingsList";
import { disabledPropAndClassName, kludgeRefSetClassname } from "../common/classnameUtil";
import type { Overwrite } from "../common/types";
import { assert } from "../common/lang";
import { testConnection } from "../common/apis/connection";
import { LoginStatus, Status } from "../common/components/LoginStatus";

type ConnectionSettingsWithMandatoryPassword = Overwrite<
  ConnectionSettingsObject,
  { password: string }
>;

interface Props {
  connectionSettings: ConnectionSettingsObject;
  saveConnectionSettings: (settings: ConnectionSettingsWithMandatoryPassword) => void;
}

interface State {
  changedSettings: Partial<ConnectionSettingsWithMandatoryPassword>;
  loginStatus: Status;
}

export class ConnectionSettings extends React.PureComponent<Props, State> {
  state: State = {
    changedSettings: {},
    loginStatus: "none",
  };

  render() {
    const canEditFields = this.state.loginStatus !== "in-progress";
    const checkboxId = uniqueId("checkbox-id-");
    const mergedSettings = this.getMergedSettings();

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          assert(mergedSettings.password != null);
          void this.testConnectionAndSave(
            mergedSettings as ConnectionSettingsWithMandatoryPassword,
          );
        }}
        className="connection-settings"
      >
        <SettingsList>
          <React.Fragment>
            <span className="label">{browser.i18n.getMessage("Host")}</span>
            <div className="input-center">
              <span>https://</span>
              <input
                type="text"
                {...disabledPropAndClassName(!canEditFields)}
                placeholder={browser.i18n.getMessage("hostname_or_IP_address")}
                value={mergedSettings.hostname}
                onChange={(e) => {
                  this.setSetting("hostname", e.currentTarget.value.trim());
                }}
                ref={kludgeRefSetClassname("host-setting")}
              />
              <span>:</span>
              <input
                {...disabledPropAndClassName(!canEditFields)}
                type="number"
                value={mergedSettings.port === 0 ? "" : mergedSettings.port}
                onChange={(e) => {
                  const port = +(e.currentTarget.value.replace(/[^0-9]/g, "") || 0);
                  this.setSetting("port", port);
                }}
                ref={kludgeRefSetClassname("port-setting")}
              />
            </div>
          </React.Fragment>
          <React.Fragment>
            <span className="label">{browser.i18n.getMessage("Username")}</span>
            <div>
              <input
                type="text"
                {...disabledPropAndClassName(!canEditFields)}
                value={mergedSettings.username}
                onChange={(e) => {
                  this.setSetting("username", e.currentTarget.value);
                }}
              />
            </div>
          </React.Fragment>
          <React.Fragment>
            <span className="label">{browser.i18n.getMessage("Password")}</span>
            <div>
              <input
                type="password"
                {...disabledPropAndClassName(!canEditFields)}
                value={mergedSettings.password ?? ""}
                onChange={(e) => {
                  this.setSetting("password", e.currentTarget.value);
                }}
              />
            </div>
          </React.Fragment>
          <React.Fragment>
            <span className="label" />
            <div className="input-center">
              <input
                type="checkbox"
                {...disabledPropAndClassName(!canEditFields)}
                id={checkboxId}
                checked={mergedSettings.rememberPassword}
                onChange={() => {
                  this.setSetting("rememberPassword", !mergedSettings.rememberPassword);
                }}
              />
              <label htmlFor={checkboxId}>{browser.i18n.getMessage("Remember_Password")}</label>
            </div>
          </React.Fragment>
        </SettingsList>

        <div className="footer">
          <LoginStatus status={this.state.loginStatus} />
          <button
            type="submit"
            {...disabledPropAndClassName(
              !canEditFields ||
                !mergedSettings.hostname ||
                !mergedSettings.port ||
                !mergedSettings.username ||
                !mergedSettings.password ||
                this.state.loginStatus === "in-progress" ||
                (this.state.loginStatus !== "none" &&
                  !ClientRequestResult.isConnectionFailure(this.state.loginStatus) &&
                  this.state.loginStatus.success),
            )}
          >
            {browser.i18n.getMessage("Login")}
          </button>
        </div>
      </form>
    );
  }

  private getMergedSettings() {
    return {
      ...this.props.connectionSettings,
      ...this.state.changedSettings,
    };
  }

  private setSetting<K extends keyof ConnectionSettingsWithMandatoryPassword>(
    key: K,
    value: ConnectionSettingsWithMandatoryPassword[K],
  ) {
    this.setState({
      loginStatus: "none",
      changedSettings: {
        ...this.state.changedSettings,
        [key]: value,
      },
    });
  }

  private testConnectionAndSave = async (settings: ConnectionSettingsWithMandatoryPassword) => {
    this.setState({
      loginStatus: "in-progress",
    });

    const result = await testConnection(settings);

    this.setState({
      loginStatus: result,
    });

    if (!ClientRequestResult.isConnectionFailure(result) && result.success) {
      this.props.saveConnectionSettings(settings);
    }
  };
}
