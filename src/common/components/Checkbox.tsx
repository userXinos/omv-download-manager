import * as React from "react";

import { useStableId } from "../hooks/useStableId";

export interface Props {
  checked: boolean;
  onChange: () => void;
  label: string;
  title?: string;
}

export function Checkbox(props: Props) {
  const id = useStableId("checkbox-id-");
  return (
    <React.Fragment>
      <input id={id} type="checkbox" checked={props.checked} onChange={props.onChange} />
      <label htmlFor={id}>{props.label}</label>
    </React.Fragment>
  );
}
