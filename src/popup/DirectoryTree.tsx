import "./directory-tree.scss";
import * as React from "react";
import classNames from "classnames";

export type DirectoryTreeFileChildren =
  | "unloaded"
  | { failureMessage: string }
  | DirectoryTreeFile[];

export interface DirectoryTreeFile {
  uuid: string;
  name: string;
  description: string;
  children: DirectoryTreeFileChildren;
}

export function isUnloadedChild(children: DirectoryTreeFileChildren): children is "unloaded" {
  return children === "unloaded";
}

export function isErrorChild(
  children: DirectoryTreeFileChildren,
): children is { failureMessage: string } {
  return (children as { failureMessage: string }).failureMessage != null;
}

export function isLoadedChild(
  children: DirectoryTreeFileChildren,
): children is DirectoryTreeFile[] {
  return !isUnloadedChild(children) && !isErrorChild(children);
}

export interface Props {
  file: DirectoryTreeFile;
  selectedPath?: string;
  requestLoad: (path: string) => void;
  onSelect: (path: string | undefined) => void;
}

export interface State {
  isExpanded: boolean;
}

export class DirectoryTree extends React.PureComponent<Props, State> {
  state: State = {
    isExpanded: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (isErrorChild(nextProps.file.children)) {
      this.setState({ isExpanded: false });
    }
  }

  render() {
    const isPlaceholder =
      isLoadedChild(this.props.file.children) && this.props.file.children.length === 0;
    return (
      <div className="directory-tree">
        <div
          className={classNames("directory-header", {
            "is-selected": this.props.selectedPath === this.props.file.uuid,
          })}
        >
          <div
            className={classNames("directory-icon-wrapper", {
              placeholder: isPlaceholder,
              disabled: isErrorChild(this.props.file.children),
            })}
            onClick={isErrorChild(this.props.file.children) ? undefined : this.toggleExpanded}
            title={
              isErrorChild(this.props.file.children)
                ? this.props.file.children.failureMessage
                : browser.i18n.getMessage("Expandcollapse_directory")
            }
          >
            <span
              className={classNames("fa", {
                "fa-chevron-right expand-collapse":
                  isUnloadedChild(this.props.file.children) ||
                  (!isErrorChild(this.props.file.children) && this.props.file.children.length > 0),
                "fa-exclamation-triangle intent-warning": isErrorChild(this.props.file.children),
                "fa-fighter-jet": isPlaceholder,
                "is-expanded": this.state.isExpanded,
              })}
            />
          </div>
          <div className="name" onClick={this.onSelect} title={this.props.file.name}>
            {this.props.file.description}
          </div>
        </div>
        {this.renderChildren()}
      </div>
    );
  }

  private onSelect = () => {
    this.props.onSelect(this.props.file.uuid);
  };

  private toggleExpanded = () => {
    const isExpanded = !this.state.isExpanded;
    this.setState({ isExpanded });
    if (isExpanded && isUnloadedChild(this.props.file.children)) {
      this.props.requestLoad(this.props.file.uuid);
    }

    if (
      !isExpanded &&
      this.props.selectedPath &&
      this.props.selectedPath.startsWith(this.props.file.uuid)
    ) {
      this.props.onSelect(undefined);
    }
  };

  private renderChildren(): React.ReactNode {
    if (this.state.isExpanded) {
      if (isUnloadedChild(this.props.file.children)) {
        return <div className="children loading">{browser.i18n.getMessage("Loading")}</div>;
      } else if (isErrorChild(this.props.file.children)) {
        return null;
      } else if (this.props.file.children.length === 0) {
        return null;
      } else {
        return (
          <ul className="children loaded">
            {this.props.file.children.map((child) => (
              <DirectoryTree
                key={child.uuid}
                file={child}
                requestLoad={this.props.requestLoad}
                selectedPath={this.props.selectedPath}
                onSelect={this.props.onSelect}
              />
            ))}
          </ul>
        );
      }
    } else {
      return null;
    }
  }
}
