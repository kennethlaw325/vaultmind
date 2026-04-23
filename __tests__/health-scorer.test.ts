import { calculateHealthScore } from "../src/core/health-scorer";
import { LintIssue } from "../src/types";

function makeIssue(type: LintIssue["type"]): LintIssue {
  const severityMap: Record<LintIssue["type"], LintIssue["severity"]> = {
    "broken-link": "critical",
    "orphan": "warning",
    "stale": "info",
    "missing-overview": "warning",
  };
  return {
    id: `${type}-test`,
    type,
    severity: severityMap[type],
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

  // === Phase 2a: min floor 5/25 per dimension ===

  it("never goes below min floor 5 on consistency", () => {
    // 500 broken links on 10 notes would zero out pre-2a; now floors at 5
    const issues = Array.from({ length: 500 }, () => makeIssue("broken-link"));
    const score = calculateHealthScore(issues, 10);
    expect(score.consistency).toBeGreaterThanOrEqual(5);
  });

  it("never goes below min floor 5 on connectivity", () => {
    const issues = Array.from({ length: 500 }, () => makeIssue("orphan"));
    const score = calculateHealthScore(issues, 10);
    expect(score.connectivity).toBeGreaterThanOrEqual(5);
  });

  it("never goes below min floor 5 on freshness", () => {
    const issues = Array.from({ length: 500 }, () => makeIssue("stale"));
    const score = calculateHealthScore(issues, 10);
    expect(score.freshness).toBeGreaterThanOrEqual(5);
  });

  it("never goes below min floor 5 on completeness", () => {
    const issues = Array.from({ length: 50 }, () => makeIssue("missing-overview"));
    const score = calculateHealthScore(issues, 10);
    expect(score.completeness).toBeGreaterThanOrEqual(5);
  });

  it("worst-case total score is at least 20 (5 * 4)", () => {
    const issues = [
      ...Array.from({ length: 200 }, () => makeIssue("broken-link")),
      ...Array.from({ length: 200 }, () => makeIssue("orphan")),
      ...Array.from({ length: 500 }, () => makeIssue("stale")),
      ...Array.from({ length: 50 }, () => makeIssue("missing-overview")),
    ];
    const score = calculateHealthScore(issues, 10);
    expect(score.total).toBeGreaterThanOrEqual(20);
  });

  // === Phase 2a: severity-aware penalty weighting ===

  it("broken links (critical) penalize faster than orphans (warning)", () => {
    const brokenScore = calculateHealthScore(
      Array.from({ length: 5 }, () => makeIssue("broken-link")),
      100
    );
    const orphanScore = calculateHealthScore(
      Array.from({ length: 5 }, () => makeIssue("orphan")),
      100
    );
    // broken-link dimension (consistency) should lose more points than
    // orphan dimension (connectivity) for equal count
    expect(25 - brokenScore.consistency).toBeGreaterThan(
      25 - orphanScore.connectivity
    );
  });

  it("orphans (warning) penalize faster than stale (info)", () => {
    const orphanScore = calculateHealthScore(
      Array.from({ length: 10 }, () => makeIssue("orphan")),
      100
    );
    const staleScore = calculateHealthScore(
      Array.from({ length: 10 }, () => makeIssue("stale")),
      100
    );
    expect(25 - orphanScore.connectivity).toBeGreaterThan(
      25 - staleScore.freshness
    );
  });
});
