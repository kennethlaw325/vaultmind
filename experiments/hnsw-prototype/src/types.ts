/**
 * HNSW prototype — shared types.
 *
 * Standalone experiment under experiments/hnsw-prototype/.
 * NOT imported by the VaultMind plugin.
 */

export interface NoteRecord {
  /** Filesystem path or vault-relative path */
  path: string;
  /** Note title (filename without extension) */
  title: string;
  /** Full plain text body of the note */
  body: string;
  /** Last modified timestamp in ms since epoch */
  mtime: number;
  /** SHA-256 of body content; used to skip re-embedding unchanged notes */
  contentHash: string;
}

export interface EmbeddedNote extends NoteRecord {
  /** 384-dim float vector from all-MiniLM-L6-v2 */
  embedding: Float32Array;
}

export interface IndexManifest {
  modelName: string;
  embeddingDim: number;
  /** Map note path → row index in the embeddings matrix */
  rows: Record<string, number>;
  /** Per-row mtime + hash for incremental updates */
  meta: Array<{ path: string; mtime: number; contentHash: string }>;
  builtAt: number;
}

export interface SearchOptions {
  query: string;
  topK?: number;
  minScore?: number;
  filterFolders?: string[];
}

export interface SearchResult {
  path: string;
  title: string;
  score: number;
  excerpt?: string;
}

export type EmbeddingFn = (text: string) => Promise<Float32Array>;
