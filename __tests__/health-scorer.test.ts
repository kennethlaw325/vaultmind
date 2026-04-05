import { calculateHealthScore } from "../src/core/health-scorer";
import { LintIssue } from "../src/types";

function makeIssue(type: LintIssue["type"]): LintIssue {
  return {
    id: `${type}-test`,
    type,
    severity: "warning",
    notePath: "test.md",
    message: "test",
  };
}

describe("calculateHealthScore", () => {
  it("returns 100 for empty vault", () => {
    const score = calculateHealthScore([], 0);
    expect(score.total).toBe(100);
  });

  it("returns 100 for vault with no issues", () => {
    const score = calculateHealthScore([], 50);
    expect(score.total).toBe(100);
  });

  it("deducts for broken links", () => {
    const issues = [makeIssue("broken-link"), makeIssue("broken-link")];
    const score = calculateHealthScore(issues, 10);
    expect(score.total).toBeLessThan(100);
    expect(score.consistency).toBeLessThan(25);
  });

  it("deducts for orphans", () => {
    const issues = Array.from({ length: 5 }, () => makeIssue("orphan"));
    const score = calculateHealthScore(issues, 10);
    expect(score.connectivity).toBeLessThan(25);
  });

  it("never goes below 0", () => {
    const issues = Array.from({ length: 100 }, () => makeIssue("broken-link"));
    const score = calculateHealthScore(issues, 10);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.consistency).toBeGreaterThanOrEqual(0);
  });

  it("tracks issue count", () => {
    const issues = [makeIssue("orphan"), makeIssue("stale"), makeIssue("broken-link")];
    const score = calculateHealthScore(issues, 50);
    expect(score.issueCount).toBe(3);
  });
});
