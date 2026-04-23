import { LintIssue, HealthScore } from "../types";

/**
 * Calculate health score across 4 dimensions.
 *
 * Phase 2a changes:
 * - Min floor 5/25 per dimension (avoid 0-bottom demoralization).
 * - Severity-aware penalty multipliers rebalanced.
 * - Broken links (critical) penalize faster than orphans (warning) faster than stale (info).
 */
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

  // Per-dimension scoring: max 25, min floor 5.
  // Penalty = deduction from 25, capped at 20 to preserve the floor.
  const MAX = 25;
  const FLOOR = 5;
  const BAND = MAX - FLOOR; // 20 deductible points

  // Critical severity: broken links — fastest penalty
  const consistencyPenalty = Math.min(
    BAND,
    (brokenLinks / totalNotes) * 150
  );
  // Warning severity: orphans — moderate penalty
  const connectivityPenalty = Math.min(
    BAND,
    (orphans / totalNotes) * 60
  );
  // Info severity: stale — gentle penalty (many are legit)
  const freshnessPenalty = Math.min(
    BAND,
    (stale / totalNotes) * 40
  );
  // Warning severity: missing overviews — cap at 8 per folder
  const completenessPenalty = Math.min(BAND, missingOverviews * 3);

  const consistency = MAX - consistencyPenalty;
  const connectivity = MAX - connectivityPenalty;
  const freshness = MAX - freshnessPenalty;
  const completeness = MAX - completenessPenalty;

  const total = Math.round(
    consistency + connectivity + freshness + completeness
  );

  return {
    total,
    consistency: Math.round(consistency),
    connectivity: Math.round(connectivity),
    freshness: Math.round(freshness),
    completeness: Math.round(completeness),
    issueCount: issues.length,
  };
}
