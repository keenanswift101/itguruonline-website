import { describe, it, expect } from "vitest";
import { ALLOWED_TRANSITIONS, STATUS_BADGE, isExpired } from "@/lib/quotation-status";

describe("ALLOWED_TRANSITIONS", () => {
  it("allows draft→sent, sent→accepted/declined/draft, declined→sent", () => {
    expect(ALLOWED_TRANSITIONS.draft).toEqual(["sent"]);
    expect(ALLOWED_TRANSITIONS.sent).toEqual(["accepted", "declined", "draft"]);
    expect(ALLOWED_TRANSITIONS.declined).toEqual(["sent"]);
  });
  it("keeps accepted terminal (no outgoing transitions)", () => {
    expect(ALLOWED_TRANSITIONS.accepted).toEqual([]);
  });
});

describe("STATUS_BADGE", () => {
  it("has a label for every status", () => {
    for (const s of ["draft", "sent", "accepted", "declined"]) {
      expect(STATUS_BADGE[s]?.label).toBeTruthy();
    }
  });
});

describe("isExpired", () => {
  it("is true only for a sent quote past valid_until", () => {
    expect(isExpired("sent", "2000-01-01")).toBe(true);
    expect(isExpired("sent", "2999-01-01")).toBe(false);
    expect(isExpired("draft", "2000-01-01")).toBe(false);
    expect(isExpired("accepted", "2000-01-01")).toBe(false);
  });
});
