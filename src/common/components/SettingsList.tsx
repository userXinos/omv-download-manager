import "./settings-list.scss";

import * as React from "react";

export function SettingsList(props: React.PropsWithChildren<{}>) {
  if (Array.isArray(props.children)) {
    return (
      <ul className="settings-list">
        {props.children.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    );
  }
  return null;
}
