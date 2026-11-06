import type { D1Database } from "@cloudflare/workers-types";

/** Public article discovery. Does not perform writes or expose drafts.
 * FTS is optional: older D1 schemas and punctuation-heavy user queries must
 * still work through bound, escaped LIKE expressions.
 */
export const ARTICLES_PAGE_SIZE = 18;
export const MAX_ARTICLE_PAGE = 100;
export const MAX_SEARCH_LENGTH = 120;
export const MAX_CATEGORY_LENGTH = 80;

const FIELDS = [
  "a.id", "a.slug", "a.title", "a.summary AS content", "a.category",
  "a.cover_image", "a.tags", "a.views", "a.likes", "a.created_at",
  "(SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') AS comment_count",
].join(", ");

export function normalizeSearch(input: unknown): string {
  return typeof input === "string" ? input.trim().slice(0, MAX_SEARCH_LENGTH) : "";
}

export function normalizeCategory(input: unknown): string {
  if (typeof input !== "string") return "all";
  const category = input.trim();
  return category && category.length <= MAX_CATEGORY_LENGTH ? category : "all";
}

export function normalizePage(input: unknown): number {
  if (typeof input !== "string" || !/^[1-9]\d{0,2}$/.test(input)) return 1;
  const page = Number(input);
  return page <= MAX_ARTICLE_PAGE ? page : 1;
}

/** Escape wildcard characters with an explicit SQLite LIKE ESCAPE clause. */
export function escapeSqlLike(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Force one literal FTS phrase, so operators, quotes and punctuation are data. */
export function literalFtsPhrase(input: string): string {
  return '"' + input.replace(/"/g, '""') + '"';
}

type ArticleFilter = { q: string; category: string; page: number };
type Database = Pick<D1Database, "prepare">;

function statement(filter: ArticleFilter, useFts: boolean) {
  const conditions = ["a.status = 'published'"];
  const args: Array<string | number> = [];
  let join = "";
  if (filter.q && useFts) {
    join = " JOIN articles_fts AS f ON f.rowid = a.id";
    conditions.push("articles_fts MATCH ?");
    args.push(literalFtsPhrase(filter.q));
  } else if (filter.q) {
    conditions.push("(a.title LIKE ? ESCAPE '\\' OR a.summary LIKE ? ESCAPE '\\' OR a.tags LIKE ? ESCAPE '\\')");
    const pattern = "%" + escapeSqlLike(filter.q) + "%";
    args.push(pattern, pattern, pattern);
  }
  if (filter.category !== "all") {
    conditions.push("a.category = ?");
    args.push(filter.category);
  }
  args.push(ARTICLES_PAGE_SIZE + 1, (filter.page - 1) * ARTICLES_PAGE_SIZE);
  const sql = "SELECT " + FIELDS + " FROM articles AS a" + join +
    " WHERE " + conditions.join(" AND ") +
    " ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?";
  return { sql, args };
}

async function execute<T>(db: Database, filter: ArticleFilter, fts: boolean): Promise<T[]> {
  const query = statement(filter, fts);
  const data = await db.prepare(query.sql).bind(...query.args).all();
  return (data.results || []) as T[];
}

/**
 * Returns one page plus a hasNext signal, without an expensive extra COUNT.
 * If the FTS index is unavailable, invalid or simply misses Chinese text,
 * a normal parameterized LIKE search provides the expected results.
 */
export async function listPublishedArticles<T>(
  db: Database,
  options: { q?: string; category?: string; page?: number },
): Promise<{ articles: T[]; hasNext: boolean; usedFallback: boolean }> {
  const filter = {
    q: normalizeSearch(options.q),
    category: normalizeCategory(options.category),
    page: options.page && options.page >= 1 && options.page <= MAX_ARTICLE_PAGE
      ? Math.trunc(options.page) : 1,
  };
  let rows: T[];
  let usedFallback = false;

  if (!filter.q) {
    rows = await execute<T>(db, filter, false);
  } else {
    try {
      rows = await execute<T>(db, filter, true);
      if (rows.length === 0) {
        usedFallback = true;
        rows = await execute<T>(db, filter, false);
      }
    } catch {
      usedFallback = true;
      rows = await execute<T>(db, filter, false);
    }
  }
  return {
    articles: rows.slice(0, ARTICLES_PAGE_SIZE),
    hasNext: rows.length > ARTICLES_PAGE_SIZE,
    usedFallback,
  };
}

export async function listPublishedCategories(db: Database): Promise<string[]> {
  const query = "SELECT DISTINCT category FROM articles WHERE status = 'published' " +
    "AND category IS NOT NULL AND category NOT IN ('', 'null', 'undefined') ORDER BY category";
  const result = await db.prepare(query).all();
  const unique = new Set(["all"]);
  for (const row of result.results || []) {
    const category = (row as { category?: unknown }).category;
    if (typeof category === "string" && category.trim() &&
      category.length <= MAX_CATEGORY_LENGTH) unique.add(category);
  }
  return [...unique];
}
