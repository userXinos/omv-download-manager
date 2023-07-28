import "./index.scss";
import "../common/init/nonContentContext";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { onStoredStateChange, Settings, State } from "../common/state";
import { FatalError } from "./FatalError";
import { FatalErrorWrapper } from "./FatalErrorWrapper";
import { PopupWrapper } from "./PopupWrapper";
import { PollTasks } from "../common/apis/messages";

const ELEMENT = document.getElementById("body")!;

function updateSettings(settings: Settings) {
  void browser.storage.local.set<Partial<State>>({ settings });
}

void PollTasks.send();
setInterval(() => {
  void PollTasks.send();
}, 10000);

onStoredStateChange((storedState) => {
  try {
    ReactDOM.render(
      <FatalErrorWrapper state={storedState}>
        <PopupWrapper state={storedState} updateSettings={updateSettings} />
      </FatalErrorWrapper>,
      ELEMENT,
    );
  } catch (e) {
    ReactDOM.render(<FatalError error={e} />, ELEMENT);
  }
});
