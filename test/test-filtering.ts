import "mocha";
import { expect } from "chai";

import type { DownloaderPluginTask } from "../src/common/apis/OpenMediaVault/DownloaderPlugin/Task";
import { sortTasks } from "../src/common/filtering";

describe("sortTasks", () => {
  interface MockTaskInput {
    uuid: string;
    filename: string;
    downloading: boolean;
    url?: string;
    filesize?: number;
    format?: string;
    sharedfolderref?: string;
    delete?: boolean;
  }

  function mockTask({
    uuid,
    filename,
    downloading,
    filesize,
  }: MockTaskInput): DownloaderPluginTask {
    return {
      uuid,
      filename,
      downloading,
      filesize,
    } as DownloaderPluginTask;
  }

  it("should sort by name, A-Z", () => {
    expect(
      sortTasks(
        [
          mockTask({ uuid: "2", downloading: true, filename: "b" }),
          mockTask({ uuid: "1", downloading: false, filename: "a" }),
          mockTask({ uuid: "3", downloading: true, filename: "c" }),
        ],
        "name-asc",
      ).map(({ uuid }) => uuid),
    ).to.deep.equal(["1", "2", "3"]);
  });

  it("should sort by name, Z-A", () => {
    expect(
      sortTasks(
        [
          mockTask({ uuid: "2", downloading: true, filename: "b" }),
          mockTask({ uuid: "1", downloading: false, filename: "a" }),
          mockTask({ uuid: "3", downloading: true, filename: "c" }),
        ],
        "name-desc",
      ).map(({ uuid }) => uuid),
    ).to.deep.equal(["3", "2", "1"]);
  });
});
