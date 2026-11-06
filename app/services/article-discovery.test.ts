import { describe, expect, it } from "vitest";
import {
  ARTICLES_PAGE_SIZE, escapeSqlLike, literalFtsPhrase,
  listPublishedArticles, listPublishedCategories,
  normalizeCategory, normalizePage, normalizeSearch,
} from "./article-discovery";

type FakeDB = Parameters<typeof listPublishedArticles>[0];
function mockDb(config: { fts?: unknown[]; fallback?: unknown[]; throwFts?: boolean; noQuery?: unknown[]; categories?: unknown[] } = {}) {
  const calls: Array<{ sql: string; args: unknown[] }> = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async all() {
              calls.push({ sql, args });
              if (sql.includes("JOIN articles_fts")) {
                if (config.throwFts) throw Error("no such table: articles_fts");
                return { results: config.fts || [] };
              }
              return { results: config.fallback || config.noQuery || [] };
            },
          };
        },
        async all() {
          calls.push({ sql, args: [] });
          return { results: config.categories || [] };
        },
      };
    },
  };
  return { db: db as unknown as FakeDB, calls };
}

describe("public article discovery", () => {
  it("normalizes user query, category and pagination without trusting unbounded values", () => {
    expect(normalizeSearch("  中文 查询  ")).toBe("中文 查询");
    expect(normalizeSearch(null)).toBe("");
    expect(normalizeSearch("x".repeat(200))).toHaveLength(120);
    expect(normalizeCategory(" 技术 ")).toBe("技术");
    expect(normalizeCategory("x".repeat(81))).toBe("all");
    expect(normalizeCategory(null)).toBe("all");
    expect(normalizePage("1")).toBe(1);
    expect(normalizePage("100")).toBe(100);
    for (const invalid of ["-1", "0", "101", "999999", "1.2", "01", "1 OR 1=1", "", null]) {
      expect(normalizePage(invalid)).toBe(1);
    }
  });

  it("escapes literal wildcard and escape characters, including FTS quotes", () => {
    expect(escapeSqlLike("100%_off\\sale")).toBe("100\\%\\_off\\\\sale");
    expect(literalFtsPhrase('ab" OR secret')).toBe('"ab"" OR secret"');
  });

  it("returns 18 items and truthful hasNext from a 19-item FTS result", async () => {
    const rows = Array.from({ length: ARTICLES_PAGE_SIZE + 1 }, (_, n) => ({ id: n + 1 }));
    const { db, calls } = mockDb({ fts: rows });
    const r = await listPublishedArticles<{ id: number }>(db, { q: "星空", category: "动漫", page: 2 });
    expect(r.articles).toHaveLength(ARTICLES_PAGE_SIZE);
    expect(r.hasNext).toBe(true);
    expect(r.usedFallback).toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("JOIN articles_fts ON articles_fts.rowid = a.id");
    expect(calls[0].sql).toContain("a.status = 'published'");
    expect(calls[0].sql).toContain("a.category = ?");
    expect(calls[0].sql).toContain("ORDER BY a.created_at DESC, a.id DESC");
    expect(calls[0].args).toEqual(['"星空"', "动漫", ARTICLES_PAGE_SIZE + 1, ARTICLES_PAGE_SIZE]);
  });

  it("real FTS execution errors trigger parameterized LIKE instead of a blank page", async () => {
    const { db, calls } = mockDb({ throwFts: true, fallback: [{ id: 7 }] });
    const result = await listPublishedArticles<{ id: number }>(db, { q: "Cloudflare", page: 1 });
    expect(result.articles).toEqual([{ id: 7 }]);
    expect(result.usedFallback).toBe(true);
    expect(result.hasNext).toBe(false);
    expect(calls).toHaveLength(2);
    expect(calls[0].sql).toContain("articles_fts MATCH ?");
    expect(calls[1].sql).toContain("a.title LIKE ? ESCAPE");
    expect(calls[1].sql).not.toContain("articles_fts");
    expect(calls[1].args).toEqual(["%Cloudflare%", "%Cloudflare%", "%Cloudflare%", 19, 0]);
  });

  it("FTS no-result falls back for short Chinese content not indexed by the tokenizer", async () => {
    const { db, calls } = mockDb({ fts: [], fallback: [{ slug: "中文文章" }] });
    const result = await listPublishedArticles(db, { q: "生命" });
    expect(result.usedFallback).toBe(true);
    expect(result.articles).toHaveLength(1);
    expect(calls).toHaveLength(2);
  });

  it("wildcards, punctuation and SQL fragments remain bound data, never SQL", async () => {
    const q = "%_'); DROP TABLE articles; --";
    const { db, calls } = mockDb({ throwFts: true });
    await listPublishedArticles(db, { q });
    expect(calls[1].sql).not.toContain("DROP TABLE");
    expect(calls[1].sql).toContain("LIKE ? ESCAPE");
    expect(calls[1].args[0]).toContain("\\%\\_");
    expect(calls[1].args[0]).toContain("DROP TABLE");
  });

  it("does not query FTS when search is empty or whitespace-only", async () => {
    const { db, calls } = mockDb({ noQuery: [{ id: 1 }] });
    const result = await listPublishedArticles(db, { q: "    ", category: "all", page: 1 });
    expect(result.articles).toHaveLength(1);
    expect(result.usedFallback).toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).not.toContain("articles_fts");
    expect(calls[0].args).toEqual([19, 0]);
  });

  it("normalizes untrusted numeric pagination when invoking search API directly", async () => {
    const { db, calls } = mockDb();
    await listPublishedArticles(db, { page: 1.5 });
    expect(calls[0].args.slice(-2)).toEqual([19, 0]);
    const second = mockDb();
    await listPublishedArticles(second.db, { page: 100 });
    expect(second.calls[0].args.slice(-2)).toEqual([19, 99 * 18]);
  });

  it("reports no next page when exactly 18 items are present", async () => {
    const rows = Array.from({ length: 18 }, (_, id) => ({ id }));
    const { db } = mockDb({ noQuery: rows });
    const result = await listPublishedArticles(db, {});
    expect(result.articles).toHaveLength(18);
    expect(result.hasNext).toBe(false);
  });

  it("does not quietly swallow a failed fallback database query", async () => {
    const db = { prepare() { return { bind() { return { all: async () => { throw Error("D1 unavailable"); } }; } }; } } as unknown as FakeDB;
    await expect(listPublishedArticles(db, { q: "test" })).rejects.toThrow("D1 unavailable");
  });

  it("public categories remove duplicate, oversized and invalid category values", async () => {
    const { db, calls } = mockDb({
      categories: [{ category: "技术" }, { category: "技术" }, { category: "动漫" },
        { category: "" }, { category: null }, { category: "x".repeat(81) }],
    });
    const categories = await listPublishedCategories(db);
    expect(categories).toEqual(["all", "技术", "动漫"]);
    expect(calls[0].sql).toContain("status = 'published'");
  });

  it("keeps LIKE search limited to published articles and approved comments", async () => {
    const { db, calls } = mockDb({ throwFts: true });
    await listPublishedArticles(db, { q: "话题", category: "技术", page: 3 });
    const sql = calls[1].sql;
    expect(sql).toContain("a.status = 'published'");
    expect(sql).toContain("c.status = 'approved'");
    expect(calls[1].args).toEqual(["%话题%", "%话题%", "%话题%", "技术", 19, 36]);
  });
});
