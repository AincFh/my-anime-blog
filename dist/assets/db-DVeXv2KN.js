function getDB(context) {
  const db = context?.cloudflare?.env?.anime_db;
  if (!db) {
    throw new Error("Database not available. Make sure anime_db is configured in wrangler.toml");
  }
  return db;
}
function getDBSafe(context) {
  return context?.cloudflare?.env?.anime_db || null;
}
export {
  getDB,
  getDBSafe
};
