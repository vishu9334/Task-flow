import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Unit Tests: Pagination Helpers & Calculations", () => {
  it("should calculate correct skip and take for offset pagination", () => {
    const page = 3;
    const limit = 20;
    const skip = (page - 1) * limit;
    const take = limit;

    assert.strictEqual(skip, 40);
    assert.strictEqual(take, 20);
  });

  it("should clamp invalid limit values within safe boundaries [1, 100]", () => {
    const sanitizeLimit = (val, defaultVal = 20) =>
      Math.max(1, Math.min(100, Number(val) || defaultVal));

    assert.strictEqual(sanitizeLimit(-5), 1);
    assert.strictEqual(sanitizeLimit(500), 100);
    assert.strictEqual(sanitizeLimit("abc"), 20);
    assert.strictEqual(sanitizeLimit(25), 25);
  });

  it("should format cursor pagination response with next_cursor", () => {
    const rawItems = [
      { id: "task-1", title: "Task 1" },
      { id: "task-2", title: "Task 2" },
      { id: "task-3", title: "Task 3" },
    ];
    const limit = 2;

    const hasNextPage = rawItems.length > limit;
    const data = hasNextPage ? rawItems.slice(0, limit) : rawItems;
    const next_cursor = hasNextPage ? data[data.length - 1].id : null;

    assert.strictEqual(data.length, 2);
    assert.strictEqual(next_cursor, "task-2");
  });
});
