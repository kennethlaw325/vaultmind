import { LintIssue } from "../types";

export interface Recommendation {
  issueId: string;
  suggestion: string; // 1-2 sentences, actionable
}

export interface RecommenderOptions {
  apiKey: string;
  model?: string; // default claude-haiku-4-5-20251001
  maxIssues?: number; // cap per run to control cost
  batchSize?: number; // issues per API call
}

export interface RecommenderStats {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
  batchesCalled: number;
  issuesProcessed: number;
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
// Haiku 4.5 pricing (per 1M tokens): input $0.80, output $4.00
const PRICE_INPUT_PER_1M = 0.8;
const PRICE_OUTPUT_PER_1M = 4.0;

/**
 * Filter issues to only those that benefit from AI recommendations.
 * Broken links + missing overviews are actionable; orphans/stale are mostly obvious.
 */
export function selectRecommendableIssues(
  issues: LintIssue[],
  maxIssues: number = 30
): LintIssue[] {
  const recommendable = issues.filter(
    (i) => i.type === "broken-link" || i.type === "missing-overview"
  );
  return recommendable.slice(0, maxIssues);
}

/**
 * Build a single batch prompt covering multiple issues at once.
 * Returns suggestions keyed by issue id.
 */
function buildBatchPrompt(batch: LintIssue[]): string {
  const lines = batch.map((issue, i) => {
    if (issue.type === "broken-link") {
      return `Issue ${i + 1} (id=${issue.id}): In note "${issue.notePath}", there is a broken wikilink. ${issue.detail || issue.message}`;
    }
    if (issue.type === "missing-overview") {
      return `Issue ${i + 1} (id=${issue.id}): Folder "${issue.notePath}" has multiple notes but no overview/index file. ${issue.detail || issue.message}`;
    }
    return `Issue ${i + 1} (id=${issue.id}): ${issue.message}`;
  });

  return `You are reviewing an Obsidian knowledge vault. For each issue below, give ONE short actionable suggestion (max 25 words). Be concrete — say exactly what to do, not generic advice.

Output as JSON array, one object per issue, same order:
[{"id": "<issue id>", "suggestion": "<your suggestion>"}, ...]

Issues:
${lines.join("\n")}

Return only the JSON array, no other text.`;
}

/**
 * Call Anthropic Messages API with fetch() (no SDK, per CLAUDE.md rule).
 */
async function callAnthropicAPI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  return { text, inputTokens, outputTokens };
}

/**
 * Parse the JSON array response back into Recommendation[].
 * Tolerant to extra whitespace, code fences, leading/trailing text.
 */
export function parseRecommendations(text: string): Recommendation[] {
  // Strip code fences if the model wrapped its output
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // Find the first [ ... ] array in the text
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    return [];
  }
  const jsonChunk = cleaned.slice(firstBracket, lastBracket + 1);

  try {
    const parsed = JSON.parse(jsonChunk);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { id: string; suggestion: string } =>
          typeof item?.id === "string" && typeof item?.suggestion === "string"
      )
      .map((item) => ({
        issueId: item.id,
        suggestion: item.suggestion.trim(),
      }));
  } catch {
    return [];
  }
}

/**
 * Generate AI recommendations for a list of lint issues via Anthropic API.
 * Batches issues to reduce API calls and cost.
 */
export async function generateRecommendations(
  issues: LintIssue[],
  opts: RecommenderOptions
): Promise<{ recommendations: Recommendation[]; stats: RecommenderStats }> {
  if (!opts.apiKey) {
    throw new Error("Anthropic API key is required");
  }

  const model = opts.model ?? DEFAULT_MODEL;
  const batchSize = opts.batchSize ?? 10;
  const selected = selectRecommendableIssues(issues, opts.maxIssues ?? 30);

  const recommendations: Recommendation[] = [];
  const stats: RecommenderStats = {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUSD: 0,
    batchesCalled: 0,
    issuesProcessed: selected.length,
  };

  for (let i = 0; i < selected.length; i += batchSize) {
    const batch = selected.slice(i, i + batchSize);
    const prompt = buildBatchPrompt(batch);
    const { text, inputTokens, outputTokens } = await callAnthropicAPI(
      prompt,
      opts.apiKey,
      model
    );
    stats.inputTokens += inputTokens;
    stats.outputTokens += outputTokens;
    stats.batchesCalled += 1;

    const parsed = parseRecommendations(text);
    recommendations.push(...parsed);
  }

  stats.estimatedCostUSD =
    (stats.inputTokens / 1_000_000) * PRICE_INPUT_PER_1M +
    (stats.outputTokens / 1_000_000) * PRICE_OUTPUT_PER_1M;

  return { recommendations, stats };
}

/**
 * Estimate cost before calling the API, based on heuristic token counts.
 */
export function estimateCost(
  issueCount: number,
  batchSize: number = 10
): { inputTokens: number; outputTokens: number; costUSD: number } {
  const batches = Math.ceil(issueCount / batchSize);
  // Rough: 80 tokens prompt + 70 tokens per issue (input side)
  //        35 tokens per issue (output side)
  const inputTokens = batches * 80 + issueCount * 70;
  const outputTokens = issueCount * 35;
  const costUSD =
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_1M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_1M;
  return { inputTokens, outputTokens, costUSD };
}
