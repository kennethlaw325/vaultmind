import { LintIssue, HealthScore } from "../types";

export function calculateHealthScore(
  issues: LintIssue[],
  totalNotes: number
): HealthScore {
  if (totalNotes === 0) {
    return {
      total: 100,
      consistency: 25,
      connectivity: 25,
      freshness: 25,
      completeness: 25,
      issueCount: 0,
    };
  }

  const brokenLinks = issues.filter((i) => i.type === "broken-link").length;
  const orphans = issues.filter((i) => i.type === "orphan").length;
  const stale = issues.filter((i) => i.type === "stale").length;
  const missingOverviews = issues.filter(
    (i) => i.type === "missing-overview"
  ).length;

  // Each dimension: 25 points, deduct proportionally
  const consistency = Math.max(
    0,
    25 - Math.min(25, (brokenLinks / totalNotes) * 100)
  );
  const connectivity = Math.max(
    0,
    25 - Math.min(25, (orphans / totalNotes) * 80)
  );
  const freshness = Math.max(
    0,
    25 - Math.min(25, (stale / totalNotes) * 60)
  );
  const completeness = Math.max(0, 25 - missingOverviews * 5);

  const total = Math.round(consistency + connectivity + freshness + completeness);

  return {
    total,
    consistency: Math.round(consistency),
    connectivity: Math.round(connectivity),
    freshness: Math.round(freshness),
    completeness: Math.round(completeness),
    issueCount: issues.length,
  };
}
