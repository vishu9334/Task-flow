import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MIN_FIXED_VERSION = "6.5.1";

function versionAtLeast(actual, minimum) {
  const a = actual.split("-")[0].split(".").map(Number);
  const b = minimum.split("-")[0].split(".").map(Number);

  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }

  return true;
}

describe("BullMQ flow parent release", () => {
  it("pins bullmq to the release that defers parent release until all children are added", () => {
    const lockfile = JSON.parse(
      readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8")
    );
    const lockedVersion = lockfile.packages?.["node_modules/bullmq"]?.version;

    assert.ok(
      lockedVersion,
      "expected package-lock.json to resolve bullmq for the project"
    );
    assert.ok(
      versionAtLeast(lockedVersion, MIN_FIXED_VERSION),
      `bullmq ${lockedVersion} predates the flow parent-release fix; expected >= ${MIN_FIXED_VERSION}`
    );
  });
});