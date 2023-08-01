import "./task.scss";
import * as React from "react";
import { default as startCase } from "lodash/startCase";
import { default as upperCase } from "lodash/upperCase";
import classNames from "classnames";

import { formatMetric1024, formatTime, formatPercentage } from "../common/format";
import { matchesFilter } from "../common/filtering";
import type { DownloaderPluginTask } from "../common/apis/OpenMediaVault/DownloaderPlugin/Task";
import { MessageResponse } from "../common/apis/messages";

export interface Props {
  task: DownloaderPluginTask;
  onDelete?: (taskId: string) => Promise<MessageResponse>;
  onStart?: (taskId: string) => Promise<MessageResponse>;
}

export interface State {
  startState: "none" | "in-progress" | MessageResponse;
  deleteState: "none" | "in-progress" | MessageResponse;
}

export class Task extends React.PureComponent<Props, State> {
  state: State = {
    startState: "none",
    deleteState: "none",
  };

  render() {
    if (MessageResponse.is(this.state.deleteState) && this.state.deleteState.success) {
      return null;
    } else {
      const isErrored = matchesFilter(this.props.task, "errored");
      return (
        <li className="task" key={this.props.task.uuid}>
          <div className="header">
            <div className="name-and-status">
              <div className="name" title={this.props.task.filename}>
                {this.props.task.filename}
              </div>
              <div className="status">{this.renderStatus()}</div>
            </div>
            {/*{this.renderPauseResumeButton()}*/}
            {this.renderStartButton()}
            {this.renderRemoveButton()}
          </div>
          <div className="progress-bar">
            <div
              className={classNames("bar-fill", {
                "in-progress": matchesFilter(this.props.task, "downloading"),
                completed:
                  matchesFilter(this.props.task, "uploading") ||
                  matchesFilter(this.props.task, "completed"),
                errored: isErrored,
                unknown: matchesFilter(this.props.task, "other"),
              })}
              // style={{ width: `${(isErrored ? 1 : this.computeFractionComplete()) * 100}%` }}
              style={{ width: `${(isErrored ? 1 : 0) * 100}%` }}
            />
            <div className="bar-background" />
          </div>
        </li>
      );
    }
  }

  // private computeFractionComplete() {
  //   const fractionComplete =
  //     Math.floor(
  //       (this.props.task.additional!.transfer!.size_downloaded / this.props.task.size) * 100,
  //     ) / 100;
  //   return Number.isFinite(fractionComplete) ? fractionComplete : 0;
  // }

  // private computeSecondsRemaining(): number | undefined {
  //   const secondsRemaining = Math.round(
  //     (this.props.task.size - this.props.task.additional!.transfer!.size_downloaded) /
  //       this.props.task.additional!.transfer!.speed_download,
  //   );
  //   return Number.isFinite(secondsRemaining) ? secondsRemaining : undefined;
  // }

  private renderStatus() {
    const status = this.props.task.downloading
      ? "downloading"
      : this.props.task.filesize > 0
      ? "finished"
      : "waiting";

    const renderStatusLine = (iconName: string, subtitle: React.ReactChild) => {
      return (
        <span title={startCase(status)}>
          <span className={classNames("status-icon", iconName)} />
          <span className="text">{subtitle}</span>
        </span>
      );
    };

    if (matchesFilter(this.props.task, "downloading")) {
      // const fraction = this.computeFractionComplete();
      // const eta = this.computeSecondsRemaining();
      const fraction = 0;
      const eta = null;

      // noinspection PointlessBooleanExpressionJS
      return renderStatusLine(
        "fa fa-arrow-down",
        browser.i18n.getMessage("ZpercentZ_ZestimateZ_ZcurrentZ_of_ZtotalZ_at_ZspeedZ", [
          formatPercentage(fraction),
          eta != null
            ? browser.i18n.getMessage("ZetaZ_remaining", [formatTime(eta)])
            : browser.i18n.getMessage("no_estimate"),
          // `${formatMetric1024(this.props.task.additional!.transfer!.size_downloaded)}B`,
          // `${formatMetric1024(this.props.task.size)}B`,
          // `${formatMetric1024(this.props.task.additional!.transfer!.speed_download)}B/s`,
        ]),
      );
      // } else if (matchesFilter(this.props.task, "uploading")) {
      //   return renderStatusLine(
      //     "fa fa-arrow-up",
      //     browser.i18n.getMessage("ZratioZ_ratio_ZtotalZ_uploaded_at_ZspeedZ", [
      //       `${(this.props.task.additional!.transfer!.size_uploaded / this.props.task.size).toFixed(
      //         2,
      //       )}`,
      //       `${formatMetric1024(this.props.task.additional!.transfer!.size_uploaded)}B`,
      //       `${formatMetric1024(this.props.task.additional!.transfer!.speed_upload)}B/s`,
      //     ]),
      //   );
    } else if (matchesFilter(this.props.task, "completed")) {
      return renderStatusLine(
        "fa fa-check",
        browser.i18n.getMessage("100_ZtotalZ_downloaded", [
          `${formatMetric1024(this.props.task.filesize)}B`,
        ]),
      );
      // } else if (matchesFilter(this.props.task, "errored")) {
      //   return (
      //     <span className="intent-error">
      //       <span className="fa fa-exclamation-triangle error-icon" />
      //       {upperCase(this.props.task.status)}{" "}
      //       {this.props.task.status_extra
      //         ? `\u2013 ${startCase(this.props.task.status_extra.error_detail)}`
      //         : ""}
      //     </span>
      //   );
    } else {
      //const fraction = this.computeFractionComplete();
      const fraction = 0;
      return renderStatusLine(
        "fa fa-clock",
        browser.i18n.getMessage("ZstatusZ_ZpercentZ_ZcurrentZ_of_ZtotalZ_downloaded", [
          upperCase(status),
          formatPercentage(fraction),
          //`${formatMetric1024(this.props.task.additional!.transfer!.size_downloaded)}B`,
          `${formatMetric1024(this.props.task.filesize)}B`,
        ]),
      );
    }
  }

  private renderStartButton() {
    const status = this.props.task.downloading
      ? "downloading"
      : this.props.task.filesize > 0
      ? "finished"
      : "waiting";

    if (status == "finished" || status == "downloading") {
      return null;
    }

    let title: string = "";
    let disabled: boolean = this.state.deleteState === "in-progress";
    if (this.props.onStart == null || this.state.startState === "in-progress") {
      title = browser.i18n.getMessage("Resume");
      disabled = true;
    } else if (this.state.startState === "none") {
      title = browser.i18n.getMessage("Resume");
    } else if (!this.state.startState.success) {
      title = this.state.startState.reason;
      disabled = true;
    }

    return (
      <button
        onClick={this.startTask}
        title={title}
        disabled={disabled}
        className={classNames("pause-resume-button", { disabled: disabled })}
      >
        <div
          className={classNames("fa", {
            "fa-play": status === "waiting",
            "fa-sync fa-spin": this.state.startState === "in-progress",
          })}
        />
      </button>
    );
  }

  private renderRemoveButton() {
    let title: string = "";
    let disabled: boolean = this.state.startState === "in-progress";
    if (this.props.onDelete == null || this.state.deleteState === "in-progress") {
      title = browser.i18n.getMessage("Remove_download");
      disabled = true;
    } else if (this.state.deleteState === "none") {
      title = browser.i18n.getMessage("Remove_download");
    } else if (!this.state.deleteState.success) {
      title = this.state.deleteState.reason;
      disabled = true;
    }
    return (
      <button
        onClick={this.deleteTask}
        title={title}
        disabled={disabled}
        className={classNames("remove-button", { disabled: disabled })}
      >
        <div
          className={classNames("fa", {
            "fa-times": this.state.deleteState !== "in-progress",
            "fa-sync fa-spin": this.state.deleteState === "in-progress",
          })}
        />
      </button>
    );
  }

  private startTask = async () => {
    this.setState({
      startState: "in-progress",
    });
    const response = await this.props.onStart!(this.props.task.uuid);
    this.setState({
      startState: response,
    });
  };

  private deleteTask = async () => {
    this.setState({
      deleteState: "in-progress",
    });

    const response = await this.props.onDelete!(this.props.task.uuid);

    this.setState({
      deleteState: response,
    });
  };
}
