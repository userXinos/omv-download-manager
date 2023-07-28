import "./advanced-add-download-form.scss";
import * as React from "react";
import { default as last } from "lodash/last";
import classNames from "classnames";
import TextareaAutosize from "react-textarea-autosize";

import { PathSelector } from "./PathSelector";
import { startsWithAnyProtocol, ALL_DOWNLOADABLE_PROTOCOLS } from "../common/apis/protocols";
import type { PopupClient } from "./popupClient";

export interface Props {
  onClose: () => void;
  client: PopupClient;
}

export interface State {
  selectedPath: string;
  downloadUrl: string;
}

export class AdvancedAddDownloadForm extends React.PureComponent<Props, State> {
  state: State = {
    selectedPath: "",
    downloadUrl: "",
  };

  render() {
    const hasDownloadUrl = this.state.downloadUrl.length > 0;

    return (
      <div className="advanced-add-download-form">
        <TextareaAutosize
          className="url-input input-field card"
          minRows={2}
          maxRows={5}
          value={this.state.downloadUrl}
          onChange={(e) => {
            this.setState({ downloadUrl: e.currentTarget.value });
          }}
          placeholder={browser.i18n.getMessage("URLs_to_download_one_per_line")}
        />
        {/*<div className="sibling-inputs">*/}
        {/*  <input*/}
        {/*    type="text"*/}
        {/*    className="input-field"*/}
        {/*    value={this.state.ftpUsername}*/}
        {/*    onChange={(e) => {*/}
        {/*      this.setState({ ftpUsername: e.currentTarget.value });*/}
        {/*    }}*/}
        {/*    placeholder={browser.i18n.getMessage("FTP_username")}*/}
        {/*  />*/}
        {/*  <input*/}
        {/*    type="password"*/}
        {/*    className="input-field"*/}
        {/*    value={this.state.ftpPassword}*/}
        {/*    onChange={(e) => {*/}
        {/*      this.setState({ ftpPassword: e.currentTarget.value });*/}
        {/*    }}*/}
        {/*    placeholder={browser.i18n.getMessage("FTP_password")}*/}
        {/*  />*/}
        {/*</div>*/}
        {/*<input*/}
        {/*  type="password"*/}
        {/*  className="input-field"*/}
        {/*  value={this.state.unzipPassword}*/}
        {/*  onChange={(e) => {*/}
        {/*    this.setState({ unzipPassword: e.currentTarget.value });*/}
        {/*  }}*/}
        {/*  disabled={!this.state.unzipEnabled}*/}
        {/*  title={*/}
        {/*    this.state.unzipEnabled*/}
        {/*      ? undefined*/}
        {/*      : browser.i18n.getMessage("Auto_Extract_service_is_disabled_in_Download_Station")*/}
        {/*  }*/}
        {/*  placeholder={browser.i18n.getMessage("Unzip_password")}*/}
        {/*/>*/}
        <div className="download-path card">
          <div className="path-display" title={this.state.selectedPath}>
            {browser.i18n.getMessage("Download_to")}
            <span className={classNames("path", { faded: !this.state.selectedPath })}>
              {this.state.selectedPath
                ? last(this.state.selectedPath.split("/"))
                : browser.i18n.getMessage("default_location")}
            </span>
          </div>
          <PathSelector
            onSelectPath={this.setSelectedPath}
            selectedPath={this.state.selectedPath}
            client={this.props.client}
          />
        </div>
        <div className="buttons">
          <button
            onClick={this.props.onClose}
            title={browser.i18n.getMessage("Dont_add_a_new_task")}
          >
            <span className="fa fa-lg fa-times" /> {browser.i18n.getMessage("Cancel")}
          </button>
          <button
            onClick={this.addDownload}
            title={browser.i18n.getMessage("Download_the_above_URL_to_the_specified_location")}
            disabled={!hasDownloadUrl}
            className={classNames({ disabled: !hasDownloadUrl })}
          >
            <span className="fa fa-lg fa-plus" /> {browser.i18n.getMessage("Add")}
          </button>
        </div>
      </div>
    );
  }

  private addDownload = () => {
    let urls = this.state.downloadUrl
      .split("\n")
      .map((url) => url.trim())
      // The cheapest of checks. Actual invalid URLs will be caught later.
      .filter((url) => startsWithAnyProtocol(url, ALL_DOWNLOADABLE_PROTOCOLS));
    this.props.client.createTasks({
      urls,
      path: this.state.selectedPath,
    });
    this.props.onClose();
  };

  private setSelectedPath = (selectedPath: string) => {
    this.setState({ selectedPath });
  };
}
