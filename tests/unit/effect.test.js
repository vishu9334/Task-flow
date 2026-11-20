import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("effect resolves to the CVE-fixed version (GHSA-7589-6fvf-x4pw)", () => {
  const lockfile = JSON.parse(
    readFileSync(path.join(repoRoot, "package-lock.json"), "utf8")
  );
  const effect = lockfile.packages["node_modules/effect"];
  assert.ok(effect, "effect entry is missing from package-lock.json");

  const [major, minor, patch] = effect.version.split(".").map(Number);
  const isFixed =
    major > 3 || (major === 3 && (minor > 22 || (minor === 22 && patch >= 1)));
  assert.ok(
    isFixed,
    `effect ${effect.version} is affected by GHSA-7589-6fvf-x4pw; expected >= 3.22.1`
  );
});
