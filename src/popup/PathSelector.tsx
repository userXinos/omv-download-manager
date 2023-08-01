import "./path-selector.scss";
import * as React from "react";
import type { MessageResponse } from "../common/apis/messages";
import type { ShareMgmtFolder } from "../common/apis/OpenMediaVault/ShareMgmt/Folders";
import type { PopupClient } from "./popupClient";
import {
  DirectoryTree,
  DirectoryTreeFile,
  isUnloadedChild,
  isLoadedChild,
  isErrorChild,
} from "./DirectoryTree";

const ROOT_PATH = "/";

export interface Props {
  selectedPath: string | undefined;
  onSelectPath: (path: string) => void;
  client: PopupClient;
}

export interface State {
  directoryTree: DirectoryTreeFile;
}

export class PathSelector extends React.PureComponent<Props, State> {
  state: State = {
    directoryTree: {
      name: "/",
      uuid: ROOT_PATH,
      description: ROOT_PATH,
      children: "unloaded",
    },
  };

  private requestVersionByPath: Record<string, number> = {};

  render() {
    return <div className="path-selector">{this.renderContent()}</div>;
  }

  private renderContent() {
    if (isUnloadedChild(this.state.directoryTree.children)) {
      return <div className="no-content">{browser.i18n.getMessage("Loading_directories")}</div>;
    } else if (isErrorChild(this.state.directoryTree.children)) {
      return (
        <div className="no-content intent-error">
          <span className="fa fa-exclamation-triangle" />
          {this.state.directoryTree.children.failureMessage}
        </div>
      );
    } else if (this.state.directoryTree.children.length === 0) {
      return <div className="no-content">{browser.i18n.getMessage("No_directories")}</div>;
    } else {
      return (
        <div>
          {this.state.directoryTree.children.map((directory) => (
            <DirectoryTree
              key={directory.uuid}
              file={directory}
              requestLoad={this.loadNestedDirectory}
              selectedPath={this.props.selectedPath}
              onSelect={this.props.onSelectPath}
            />
          ))}
        </div>
      );
    }
  }

  componentDidMount() {
    void this.loadTopLevelDirectories();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.client !== prevProps.client) {
      this.props.onSelectPath("");
      void this.loadTopLevelDirectories();
    }
  }

  private loadNestedDirectory = async (path: string) => {
    if (!isLoadedChild(this.state.directoryTree.children)) {
      console.error(
        `programmer error: cannot load nested directories when top-level directories are not in a valid state`,
      );
    } else {
      const stashedRequestVersion = (this.requestVersionByPath[path] =
        (this.requestVersionByPath[path] || 0) + 1);

      const response = await this.props.client.listDirectories(path);

      if (stashedRequestVersion === this.requestVersionByPath[path]) {
        this.updateTreeWithResponse(response);
      }
    }
  };

  private loadTopLevelDirectories = async () => {
    const stashedRequestVersion = (this.requestVersionByPath[ROOT_PATH] =
      (this.requestVersionByPath[ROOT_PATH] || 0) + 1);
    const response = await this.props.client.listDirectories();

    if (stashedRequestVersion === this.requestVersionByPath[ROOT_PATH]) {
      this.updateTreeWithResponse(response);
    }
  };

  private updateTreeWithResponse(response: MessageResponse<ShareMgmtFolder[]>) {
    if (response.success) {
      this.setState((prev) => ({
        directoryTree: {
          ...prev.directoryTree,
          children: response.result.map((c) => ({ ...c, children: [] })),
        },
      }));
    } else {
      this.setState((prev) => ({
        directoryTree: {
          ...prev.directoryTree,
          children: { failureMessage: response.reason },
        },
      }));
    }
  }
}
