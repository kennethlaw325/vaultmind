import { VaultSnapshot, NoteMetadata } from "../types";

export interface FuzzyMatch {
  candidate: NoteMetadata;
  score: number; // 0..1, higher = closer
  distance: number; // Levenshtein (for debug)
}

/**
 * Levenshtein distance — classic DP implementation.
 * Returns the minimum number of single-character edits to transform a into b.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Two-row DP to save memory
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j] + 1,           // deletion
        prev[j - 1] + cost     // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Normalize a note name for matching: lowercase, collapse whitespace.
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Token overlap ratio — how many tokens in target also appear in candidate.
 * Returns 0..1.
 */
function tokenOverlap(target: string, candidate: string): number {
  const ta = new Set(normalize(target).split(/[\s\-_]+/).filter((t) => t.length > 0));
  const tb = new Set(normalize(candidate).split(/[\s\-_]+/).filter((t) => t.length > 0));
  if (ta.size === 0) return 0;
  let overlap = 0;
  for (const tok of ta) {
    if (tb.has(tok)) overlap++;
  }
  return overlap / ta.size;
}

/**
 * Find the best matching existing notes for a broken link target.
 * Returns top N candidates sorted by score descending.
 */
export function findBestMatches(
  brokenTarget: string,
  snapshot: VaultSnapshot,
  topN: number = 3,
  minScore: number = 0.3
): FuzzyMatch[] {
  const targetNorm = normalize(brokenTarget);
  if (targetNorm.length === 0) return [];

  const matches: FuzzyMatch[] = [];

  for (const note of snapshot.notes) {
    const candidateNorm = normalize(note.name);
    if (candidateNorm.length === 0) continue;

    // Skip if length differs too much (quick prune, > 2x difference)
    const lenRatio =
      Math.min(targetNorm.length, candidateNorm.length) /
      Math.max(targetNorm.length, candidateNorm.length);
    if (lenRatio < 0.3) continue;

    const distance = levenshtein(targetNorm, candidateNorm);
    const maxLen = Math.max(targetNorm.length, candidateNorm.length);
    const editScore = 1 - distance / maxLen;
    const overlap = tokenOverlap(targetNorm, candidateNorm);

    // Combined score: 60% token overlap + 40% edit similarity
    const score = 0.6 * overlap + 0.4 * editScore;

    if (score >= minScore) {
      matches.push({ candidate: note, score, distance });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topN);
}

/**
 * Generate an overview-note suggestion for a folder.
 * Picks representative notes and returns a proposed _index.md template.
 */
export function suggestOverviewTemplate(
  folderPath: string,
  snapshot: VaultSnapshot,
  maxNotes: number = 5
): { suggestion: string; sampleNotes: NoteMetadata[] } {
  const notesInFolder = snapshot.notes.filter(
    (n) => n.folderPath === folderPath
  );
  // Rank by inbound link count (proxy: notes whose name appears in other notes' outboundLinks)
  const inboundCount = new Map<string, number>();
  for (const note of snapshot.notes) {
    for (const target of note.outboundLinks) {
      inboundCount.set(target, (inboundCount.get(target) ?? 0) + 1);
    }
  }
  const ranked = [...notesInFolder].sort(
    (a, b) => (inboundCount.get(b.path) ?? 0) - (inboundCount.get(a.path) ?? 0)
  );
  const sample = ranked.slice(0, maxNotes);

  const folderName = folderPath.split("/").pop() ?? folderPath;
  const bullets = sample.map((n) => `- [[${n.name}]]`).join("\n");

  const suggestion = `Create "_index.md" with:\n# ${folderName}\n\n## Key notes\n${bullets || "- (folder is empty)"}`;

  return { suggestion, sampleNotes: sample };
}
