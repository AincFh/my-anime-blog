import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // 文章路由
  route("articles", "routes/articles.tsx"),
  route("articles/:slug", "routes/articles.$slug.tsx"),
  // 其他页面
  route("archive", "routes/archive.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("bangumi", "routes/bangumi.tsx"),
  // 用户认证
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("logout", "routes/logout.tsx"),
  // 法律页面
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  // 用户中心
  route("user/dashboard", "routes/user.dashboard.tsx"),
  route("user/achievements", "routes/user.achievements.tsx"),
  // 管理后台
  route("login-admin", "routes/admin.login.tsx"),
  route("admin", "routes/admin.tsx", [
    route("article/new", "routes/admin.article.new.tsx"),
    route("anime/manage", "routes/admin.anime.manage.tsx"),
    route("articles", "routes/admin.articles.tsx"),
    route("comments", "routes/admin.comments.tsx"),
    route("gallery", "routes/admin.gallery.tsx"),
    route("settings", "routes/admin.settings.tsx"),
    route("tags", "routes/admin.tags.tsx"),
    route("analytics", "routes/admin.analytics.tsx"),
    route("logout", "routes/admin.logout.tsx"),
  ]),
  // API 路由
  route("api/animes", "routes/api.animes.ts"),
  route("api/auth/login", "routes/api.auth.login.ts"),
  route("api/auth/register", "routes/api.auth.register.ts"),
  route("api/auth/send-code", "routes/api.auth.send-code.ts"),
  route("api/user/me", "routes/api.user.me.ts"),
  route("api/upload", "routes/api.upload.ts"),
  route("api/comments", "routes/api.comments.tsx"),
  route("api/admin/comments", "routes/api.admin.comments.ts"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  // 404 页面
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;



