import "../common/init/commonContext";
import { AddTasks } from "../common/apis/messages";
import { onStoredStateChange } from "../common/state";
import { DOWNLOAD_ONLY_PROTOCOLS, startsWithAnyProtocol } from "../common/apis/protocols";

const LEFT_MOUSE_BUTTON = 0;

let enabled = true;

onStoredStateChange((state) => {
  enabled = state.settings.shouldHandleDownloadLinks;
});

function recursivelyFindAnchorAncestor(
  e: HTMLElement | null,
  depth: number = 10,
): HTMLAnchorElement | undefined {
  if (e == null) {
    return undefined;
  } else if (e instanceof HTMLAnchorElement) {
    return e;
  } else if (depth === 0) {
    return undefined;
  } else {
    return recursivelyFindAnchorAncestor(e.parentElement, depth - 1);
  }
}

// I hate this implementation. True protocol handling for extensions does not exist.
// https://bugzilla.mozilla.org/show_bug.cgi?id=1271553
document.addEventListener("click", (e: MouseEvent) => {
  if (enabled && e.button === LEFT_MOUSE_BUTTON) {
    const anchor = recursivelyFindAnchorAncestor(e.target as HTMLElement);
    if (
      anchor != null &&
      anchor.href &&
      startsWithAnyProtocol(anchor.href, DOWNLOAD_ONLY_PROTOCOLS)
    ) {
      // TODO AddTasks
      void AddTasks.send({ urls: [anchor.href], path: "" });
      e.preventDefault();
    }
  }
});
