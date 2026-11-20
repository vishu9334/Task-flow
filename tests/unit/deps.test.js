import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("body-parser resolves to the CVE-fixed version (GHSA-27r3-jxmh-p828)", () => {
  const lockfile = JSON.parse(
    readFileSync(path.join(repoRoot, "package-lock.json"), "utf8")
  );
  const bodyParser = lockfile.packages["node_modules/body-parser"];
  assert.ok(bodyParser, "body-parser entry is missing from package-lock.json");

  const [major, minor] = bodyParser.version.split(".").map(Number);
  assert.ok(
    major > 2 || (major === 2 && minor >= 4),
    `body-parser ${bodyParser.version} is affected by GHSA-27r3-jxmh-p828; expected >= 2.4.0`
  );
});
