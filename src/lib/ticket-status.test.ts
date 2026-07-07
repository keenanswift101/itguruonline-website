import { describe, it, expect } from "vitest";
import { ALLOWED_TRANSITIONS } from "./ticket-status";

describe("ticket ALLOWED_TRANSITIONS", () => {
  it("open can move to in_progress or resolved", () => {
    expect(ALLOWED_TRANSITIONS.open).toEqual(["in_progress", "resolved"]);
  });
  it("in_progress can move to resolved or back to open", () => {
    expect(ALLOWED_TRANSITIONS.in_progress).toContain("resolved");
    expect(ALLOWED_TRANSITIONS.in_progress).toContain("open");
  });
  it("resolved can be reopened", () => {
    expect(ALLOWED_TRANSITIONS.resolved).toContain("open");
    expect(ALLOWED_TRANSITIONS.resolved).toContain("in_progress");
  });
});
