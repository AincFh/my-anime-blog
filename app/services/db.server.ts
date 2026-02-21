/**
 * 数据库服务封装
 * 提供类型安全的 D1 数据库操作
 */

export interface Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

/**
 * 执行查询并返回第一条记录
 */
export async function queryFirst<T = unknown>(
  db: Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    return (await stmt.bind(...params).first<T>()) || null;
  }
  return (await stmt.first<T>()) || null;
}

/**
 * 执行查询并返回所有记录
 */
export async function queryAll<T = unknown>(
  db: Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    const result = await stmt.bind(...params).all<T>();
    return result.results || [];
  }
  const result = await stmt.all<T>();
  return result.results || [];
}

/**
 * 执行更新/插入/删除操作
 */
export async function execute(
  db: Database,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    return await stmt.bind(...params).run();
  }
  return await stmt.run();
}

/**
 * 执行事务（批量操作）
 */
export async function executeBatch(
  db: Database,
  statements: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result[]> {
  const prepared = statements.map(({ sql, params }) => {
    const stmt = db.prepare(sql);
    return params && params.length > 0 ? stmt.bind(...params) : stmt;
  });

  // D1 支持批量执行
  const batch = db.batch(prepared);
  return await batch;
}

