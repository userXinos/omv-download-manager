import "./settings-form.scss";
import * as React from "react";

import {
  State as ExtensionState,
  Settings,
  VisibleTaskSettings,
  TaskSortType,
  NotificationSettings,
  redactState,
  SETTING_NAMES,
  BadgeDisplayType,
  ConnectionSettings,
} from "../common/state";
import { BUG_REPORT_URL } from "../common/constants";
import { TaskFilterSettingsForm } from "../common/components/TaskFilterSettingsForm";
import { SettingsList } from "../common/components/SettingsList";
import { Checkbox } from "../common/components/Checkbox";
import { ConnectionSettings as ConnectionSettingsComponent } from "./ConnectionSettings";
import { disabledPropAndClassName } from "../common/classnameUtil";
import { typesafePick } from "../common/lang";
import { SetLoginPassword } from "../common/apis/messages";
import type { Overwrite } from "../common/types";

export interface Props {
  extensionState: ExtensionState;
  saveSettings: (settings: Settings) => Promise<boolean>;
  lastSevereError?: string;
  clearError: () => void;
}

interface State {
  savesFailed: boolean;
  rawPollingInterval: string;
}

const POLL_MIN_INTERVAL = 15;
const POLL_DEFAULT_INTERVAL = 60;
const POLL_STEP = 15;

function isValidPollingInterval(stringValue: string) {
  return !isNaN(+stringValue) && +stringValue >= POLL_MIN_INTERVAL;
}

export class SettingsForm extends React.PureComponent<Props, State> {
  state: State = {
    savesFailed: false,
    rawPollingInterval:
      this.props.extensionState.settings.notifications.completionPollingInterval.toString() ||
      POLL_DEFAULT_INTERVAL.toString(),
  };

  render() {
    return (
      <div className="settings-form">
        {this.state.savesFailed ? (
          <div className="intent-error cannot-save">
            {browser.i18n.getMessage("Cannot_save_settings_This_is_a_bug_please_file_an_issue")}
          </div>
        ) : null}

        <header>
          <h3>{browser.i18n.getMessage("Connection")}</h3>
        </header>

        <ConnectionSettingsComponent
          connectionSettings={this.props.extensionState.settings.connection}
          saveConnectionSettings={this.updateConnectionSettings}
        />

        <div className="horizontal-separator" />

        <header>
          <h3>{browser.i18n.getMessage("Task_Display_Settings")}</h3>
          <p>{browser.i18n.getMessage("Display_these_task_types_in_the_popup_menu")}</p>
        </header>

        <TaskFilterSettingsForm
          visibleTasks={this.props.extensionState.settings.visibleTasks}
          taskSortType={this.props.extensionState.settings.taskSortType}
          badgeDisplayType={this.props.extensionState.settings.badgeDisplayType}
          showInactiveTasks={this.props.extensionState.settings.showInactiveTasks}
          updateTaskTypeVisibility={this.updateTaskTypeVisibility}
          updateTaskSortType={this.updateTaskSortType}
          updateBadgeDisplayType={this.updateBadgeDisplayType}
          updateShowInactiveTasks={this.updateShowInactiveTasks}
        />

        <div className="horizontal-separator" />

        <header>
          <h3>{browser.i18n.getMessage("Miscellaneous")}</h3>
        </header>

        <SettingsList>
          <Checkbox
            checked={this.props.extensionState.settings.notifications.enableFeedbackNotifications}
            onChange={() => {
              this.setNotificationSetting(
                "enableFeedbackNotifications",
                !this.props.extensionState.settings.notifications.enableFeedbackNotifications,
              );
            }}
            label={browser.i18n.getMessage("Notify_when_adding_downloads")}
          />
          <Checkbox
            checked={this.props.extensionState.settings.notifications.enableCompletionNotifications}
            onChange={() => {
              this.setNotificationSetting(
                "enableCompletionNotifications",
                !this.props.extensionState.settings.notifications.enableCompletionNotifications,
              );
            }}
            label={browser.i18n.getMessage("Notify_when_downloads_complete")}
          />

          <React.Fragment>
            <span className="label">
              {browser.i18n.getMessage("Check_for_completed_downloads_every")}
            </span>

            <div className="input-polling-interval">
              <input
                type="number"
                {...disabledPropAndClassName(
                  !this.props.extensionState.settings.notifications.enableCompletionNotifications,
                )}
                min={POLL_MIN_INTERVAL}
                step={POLL_STEP}
                value={this.state.rawPollingInterval}
                onChange={(e) => {
                  const rawPollingInterval = e.currentTarget.value;
                  this.setState({ rawPollingInterval });
                  if (isValidPollingInterval(rawPollingInterval)) {
                    this.setNotificationSetting("completionPollingInterval", +rawPollingInterval);
                  }
                }}
              />
              <span>{browser.i18n.getMessage("seconds")}</span>
            </div>
          </React.Fragment>
          <React.Fragment>
            <span className="label" />
            <div className="wrong-polling-interval">
              {isValidPollingInterval(this.state.rawPollingInterval) ? undefined : (
                <span className="intent-error">{browser.i18n.getMessage("at_least_15")}</span>
              )}
            </div>
          </React.Fragment>

          {/*  /!*  <SettingsListCheckbox*!/*/}
          {/*  /!*    checked={this.props.extensionState.settings.shouldHandleDownloadLinks}*!/*/}
          {/*  /!*    onChange={() => {*!/*/}
          {/*  /!*      this.setShouldHandleDownloadLinks(*!/*/}
          {/*  /!*        !this.props.extensionState.settings.shouldHandleDownloadLinks,*!/*/}
          {/*  /!*      );*!/*/}
          {/*  /!*    }}*!/*/}
          {/*  /!*    label={browser.i18n.getMessage("Handle_opening_downloadable_link_types_ZprotocolsZ", [*!/*/}
          {/*  /!*      DOWNLOAD_ONLY_PROTOCOLS.join(", "),*!/*/}
          {/*  /!*    ])}*!/*/}
          {/*  /!*  />*!/*/}
        </SettingsList>

        {this.maybeRenderDebuggingOutputAndSeparator()}
      </div>
    );
  }

  private maybeRenderDebuggingOutputAndSeparator() {
    if (this.props.lastSevereError) {
      const formattedDebugLogs = `${
        this.props.lastSevereError
      }\n\nRedacted extension state: ${JSON.stringify(
        redactState(this.props.extensionState),
        null,
        2,
      )}`;

      return (
        <>
          <div className="horizontal-separator" />

          <header>
            <h3>{browser.i18n.getMessage("Debugging_Output")}</h3>
            <p>
              {browser.i18n.getMessage("Please_")}
              <a href={BUG_REPORT_URL}>{browser.i18n.getMessage("file_a_bug")}</a>
              {browser.i18n.getMessage("_and_include_the_information_below")}
            </p>
          </header>

          <SettingsList>
            <React.Fragment>
              <textarea
                className="debugging-output"
                value={formattedDebugLogs}
                readOnly={true}
                onClick={(e) => {
                  e.currentTarget.select();
                }}
              />
            </React.Fragment>

            <React.Fragment>
              <span className="label" />
              <button onClick={this.props.clearError}>
                {browser.i18n.getMessage("Clear_output")}
              </button>
            </React.Fragment>
          </SettingsList>
        </>
      );
    } else {
      return undefined;
    }
  }

  private updateTaskTypeVisibility = (taskType: keyof VisibleTaskSettings, visibility: boolean) => {
    void this.saveSettings({
      visibleTasks: {
        ...this.props.extensionState.settings.visibleTasks,
        [taskType]: visibility,
      },
    });
  };

  private updateTaskSortType = (taskSortType: TaskSortType) => {
    void this.saveSettings({ taskSortType });
  };

  private updateBadgeDisplayType = (badgeDisplayType: BadgeDisplayType) => {
    void this.saveSettings({ badgeDisplayType });
  };

  private updateShowInactiveTasks = (showInactiveTasks: boolean) => {
    void this.saveSettings({ showInactiveTasks });
  };

  private updateConnectionSettings = async (
    connection: Overwrite<ConnectionSettings, { password: string }>,
  ) => {
    if (connection.rememberPassword) {
      await this.saveSettings({ connection });
    } else {
      await this.saveSettings({ connection: { ...connection, password: undefined } });
    }
    await SetLoginPassword.send(connection.password);
  };

  private setNotificationSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) {
    void this.saveSettings({
      notifications: {
        ...this.props.extensionState.settings.notifications,
        [key]: value,
      },
    });
  }

  // private setShouldHandleDownloadLinks(shouldHandleDownloadLinks: boolean) {
  //   void this.saveSettings({
  //     shouldHandleDownloadLinks,
  //   });
  // }

  private saveSettings = async (settings: Partial<Settings>) => {
    const success = await this.props.saveSettings({
      ...typesafePick(this.props.extensionState.settings, ...SETTING_NAMES),
      ...settings,
    });

    this.setState({
      savesFailed: this.state.savesFailed || !success,
    });
  };
}
