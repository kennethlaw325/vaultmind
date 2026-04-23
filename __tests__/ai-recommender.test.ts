import {
  parseRecommendations,
  selectRecommendableIssues,
  estimateCost,
} from "../src/core/ai-recommender";
import { LintIssue } from "../src/types";

function makeIssue(type: LintIssue["type"], id: string): LintIssue {
  const sev: Record<LintIssue["type"], LintIssue["severity"]> = {
    "broken-link": "critical",
    "orphan": "warning",
    "stale": "info",
    "missing-overview": "warning",
  };
  return {
    id,
    type,
    severity: sev[type],
    notePath: `note-${id}.md`,
    message: `test message for ${id}`,
  };
}

describe("parseRecommendations", () => {
  it("parses clean JSON array", () => {
    const input = `[{"id":"issue1","suggestion":"Fix the link target"},{"id":"issue2","suggestion":"Create an index file"}]`;
    const out = parseRecommendations(input);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ issueId: "issue1", suggestion: "Fix the link target" });
    expect(out[1]).toEqual({ issueId: "issue2", suggestion: "Create an index file" });
  });

  it("strips code fences", () => {
    const input = '```json\n[{"id":"a","suggestion":"do x"}]\n```';
    const out = parseRecommendations(input);
    expect(out).toHaveLength(1);
    expect(out[0].issueId).toBe("a");
  });

  it("tolerates leading/trailing prose", () => {
    const input = `Here are my recommendations:\n[{"id":"x","suggestion":"foo"}]\nLet me know.`;
    const out = parseRecommendations(input);
    expect(out).toHaveLength(1);
    expect(out[0].suggestion).toBe("foo");
  });

  it("returns empty on malformed JSON", () => {
    expect(parseRecommendations("not json at all")).toEqual([]);
    expect(parseRecommendations("[{broken json}")).toEqual([]);
  });

  it("skips items missing required fields", () => {
    const input = `[{"id":"a","suggestion":"ok"},{"foo":"bar"},{"id":"b"}]`;
    const out = parseRecommendations(input);
    expect(out).toHaveLength(1);
    expect(out[0].issueId).toBe("a");
  });

  it("returns empty for non-array response", () => {
    expect(parseRecommendations('{"id":"a","suggestion":"x"}')).toEqual([]);
  });
});

describe("selectRecommendableIssues", () => {
  it("keeps broken-link and missing-overview", () => {
    const issues = [
      makeIssue("broken-link", "1"),
      makeIssue("orphan", "2"),
      makeIssue("stale", "3"),
      makeIssue("missing-overview", "4"),
    ];
    const selected = selectRecommendableIssues(issues);
    expect(selected.map((i) => i.id)).toEqual(["1", "4"]);
  });

  it("caps at maxIssues", () => {
    const issues = Array.from({ length: 100 }, (_, i) =>
      makeIssue("broken-link", String(i))
    );
    const selected = selectRecommendableIssues(issues, 10);
    expect(selected).toHaveLength(10);
  });

  it("returns empty when no recommendable types", () => {
    const issues = [makeIssue("orphan", "1"), makeIssue("stale", "2")];
    expect(selectRecommendableIssues(issues)).toEqual([]);
  });
});

describe("estimateCost", () => {
  it("returns zero cost for zero issues", () => {
    const est = estimateCost(0);
    expect(est.inputTokens).toBe(0);
    expect(est.outputTokens).toBe(0);
    expect(est.costUSD).toBe(0);
  });

  it("scales with issue count", () => {
    const small = estimateCost(10);
    const large = estimateCost(100);
    expect(large.inputTokens).toBeGreaterThan(small.inputTokens);
    expect(large.costUSD).toBeGreaterThan(small.costUSD);
  });

  it("typical 30 issues stays under $0.01", () => {
    const est = estimateCost(30);
    expect(est.costUSD).toBeLessThan(0.01);
  });
});
