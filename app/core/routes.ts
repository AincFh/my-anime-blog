import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("public/pages/home.tsx"),
  route("articles", "public/pages/articles.tsx", [
    route(":slug", "public/pages/articles.$slug.tsx")
  ]),
  route("archive", "public/pages/archive.tsx"),
  route("gallery", "public/pages/gallery.tsx"),
  route("bangumi", "public/pages/bangumi.tsx"),
  route("user/dashboard", "public/pages/user.dashboard.tsx"),
  route("rss.xml", "public/pages/rss.xml.tsx"),
  route("atom.xml", "public/pages/atom.xml.tsx"),
  route("404", "public/pages/404.tsx"),
  route("api/animes", "api/public/api.animes.ts"),
  route("api/og/:slug", "api/public/api.og.tsx"),
  route("api/achievement", "api/public/api.achievement.tsx"),
  route("api/admin/purge-cache", "api/admin/api.admin.purge-cache.tsx"),
  route("api/auth/send-code", "api/auth/api.auth.send-code.ts"),
  route("api/auth/register", "api/auth/api.auth.register.ts"),
  route("api/auth/login", "api/auth/api.auth.login.ts"),
  route("api/user/me", "api/public/api.user.me.ts"),
  route("admin/login", "admin/pages/admin.login.tsx"),
  route("admin/logout", "admin/pages/admin.logout.tsx"),
  route("admin", "admin/pages/admin.tsx", [
    route("article/new", "admin/pages/admin.article.new.tsx"),
    route("articles", "admin/pages/admin.articles.tsx"),
    route("anime/manage", "admin/pages/admin.anime.manage.tsx"),
    route("gallery", "admin/pages/admin.gallery.tsx"),
    route("tags", "admin/pages/admin.tags.tsx"),
    route("cleanup", "admin/pages/admin.cleanup.tsx"),
    route("comments", "admin/pages/admin.comments.tsx"),
    route("settings", "admin/pages/admin.settings.tsx"),
  ])
] satisfies RouteConfig;
