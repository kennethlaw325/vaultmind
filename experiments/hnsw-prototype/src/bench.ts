/**
 * Synthetic-vector bench for BruteForceIndex.
 *
 * Validates the DESIGN.md claim that brute-force kNN is adequate for vaults
 * under ~10K notes. Generates N random 384-dim L2-normalized vectors,
 * times build + warmup + measured query passes, and prints a markdown table.
 *
 * Run:  npm run bench
 *
 * Decision rule (from DESIGN.md): if p95 query latency stays under 50ms at
 * Kenneth's actual vault size (~700 notes today, plausibly 5K within a year),
 * brute-force is fine. HNSW only earns its complexity past that bar.
 */

import { BruteForceIndex, l2Normalize } from "./brute-force-knn";

const DIM = 384;
const TOP_K = 10;
const WARMUP_QUERIES = 20;
const MEASURED_QUERIES = 200;

const SIZES = [100, 500, 1_000, 2_500, 5_000, 10_000, 20_000];

function randomNormalizedVector(seed: number, dim: number = DIM): Float32Array {
  // Linear congruential PRNG seeded per-call so results are deterministic
  // across runs without pulling in an RNG dep.
  let s = seed >>> 0;
  const v = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    v[i] = (s / 0xffffffff) * 2 - 1;
  }
  return l2Normalize(v);
}

interface PassResult {
  size: number;
  buildMs: number;
  meanQueryMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  approxHeapMb: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function benchSize(size: number): PassResult {
  const idx = new BruteForceIndex();

  const buildStart = performance.now();
  const rows = new Array(size);
  for (let i = 0; i < size; i++) {
    rows[i] = {
      path: `notes/n${i}.md`,
      title: `Note ${i}`,
      embedding: randomNormalizedVector(i + 1),
    };
  }
  idx.bulk(rows);
  const buildMs = performance.now() - buildStart;

  const queryVec = randomNormalizedVector(999_999);

  // Warmup — let any JIT kick in
  for (let i = 0; i < WARMUP_QUERIES; i++) idx.search(queryVec, TOP_K);

  // Measured pass
  const timings = new Array<number>(MEASURED_QUERIES);
  for (let i = 0; i < MEASURED_QUERIES; i++) {
    const q = randomNormalizedVector(2_000_000 + i);
    const t0 = performance.now();
    idx.search(q, TOP_K);
    timings[i] = performance.now() - t0;
  }
  timings.sort((a, b) => a - b);

  const sum = timings.reduce((acc, x) => acc + x, 0);
  const meanQueryMs = sum / timings.length;

  // Each embedding: DIM * 4 bytes (Float32). Plus row overhead (~80 bytes for
  // JS object header + path/title strings, very rough).
  const approxHeapMb = (size * (DIM * 4 + 80)) / (1024 * 1024);

  return {
    size,
    buildMs,
    meanQueryMs,
    p50Ms: percentile(timings, 0.5),
    p95Ms: percentile(timings, 0.95),
    p99Ms: percentile(timings, 0.99),
    approxHeapMb,
  };
}

function formatTable(results: PassResult[]): string {
  const lines = [
    `# BruteForceIndex synthetic bench`,
    ``,
    `- Vector dim: ${DIM}`,
    `- Top K: ${TOP_K}`,
    `- Warmup queries: ${WARMUP_QUERIES}`,
    `- Measured queries: ${MEASURED_QUERIES}`,
    `- Node: ${process.version}`,
    `- Platform: ${process.platform} ${process.arch}`,
    `- Ran: ${new Date().toISOString()}`,
    ``,
    `| Notes | Build ms | Mean query ms | p50 | p95 | p99 | ~Heap MB |`,
    `|---:|---:|---:|---:|---:|---:|---:|`,
  ];
  for (const r of results) {
    lines.push(
      `| ${r.size.toLocaleString()} | ${r.buildMs.toFixed(1)} | ` +
        `${r.meanQueryMs.toFixed(2)} | ${r.p50Ms.toFixed(2)} | ` +
        `${r.p95Ms.toFixed(2)} | ${r.p99Ms.toFixed(2)} | ` +
        `${r.approxHeapMb.toFixed(1)} |`
    );
  }
  lines.push(``);
  lines.push(`## How to read`);
  lines.push(``);
  lines.push(`- **p95 < 50ms**: Brute-force is fine. Ship as-is, defer HNSW.`);
  lines.push(`- **p95 50-150ms**: User-perceptible. Add a 200ms search debounce`);
  lines.push(`  in the UI and re-evaluate at next vault-size milestone.`);
  lines.push(`- **p95 > 150ms**: HNSW now earns its keep. Revisit hnswlib-node`);
  lines.push(`  or pure-TS HNSW; pay the bundle-size + native-binary cost.`);
  lines.push(``);
  lines.push(`Synthetic vectors are uniformly distributed and L2-normalized.`);
  lines.push(`Real embeddings are typically clustered; clustering makes the`);
  lines.push(`brute-force scan slightly faster (cache-friendlier) but doesn't`);
  lines.push(`change the asymptote. Treat these numbers as an upper bound.`);
  return lines.join("\n");
}

function main(): void {
  const argSizes = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
  const sizes = argSizes.length > 0 ? argSizes : SIZES;

  console.error(`# bench: dim=${DIM} topK=${TOP_K} sizes=[${sizes.join(", ")}]`);
  const results: PassResult[] = [];
  for (const n of sizes) {
    console.error(`  running size=${n}...`);
    results.push(benchSize(n));
  }
  console.log(formatTable(results));
}

main();
