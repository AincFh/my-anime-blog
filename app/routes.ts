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
  route("bangumi/:id", "routes/bangumi.$id.tsx"),
  // 用户认证
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("logout", "routes/logout.tsx"),
  // 法律页面
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("disclaimer", "routes/disclaimer.tsx"),
  route("legal/sponsor", "routes/legal.sponsor.tsx"),
  route("legal/privacy", "routes/legal.privacy.tsx"),
  // 用户中心
  route("user/dashboard", "routes/user.dashboard.tsx"),
  route("user/achievements", "routes/user.achievements.tsx"),
  route("user/membership", "routes/user.membership.tsx"),
  route("shop", "routes/shop.tsx"),
  route("settings", "routes/settings.tsx"),
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
    route("*", "routes/admin.404.tsx"),
  ]),
  // API 路由
  route("action/set-theme", "routes/action.set-theme.ts"),
  route("api/animes", "routes/api.animes.ts"),
  route("api/auth/login", "routes/api.auth.login.ts"),
  route("api/auth/register", "routes/api.auth.register.ts"),
  route("api/auth/send-code", "routes/api.auth.send-code.ts"),
  route("api/user/me", "routes/api.user.me.ts"),
  route("api/upload", "routes/api.upload.ts"),
  route("api/comments", "routes/api.comments.tsx"),
  route("api/admin/comments", "routes/api.admin.comments.ts"),
  // 支付回调
  route("api/payment/callback", "routes/api.payment.callback.ts"),
  route("api/payment/mock-complete", "routes/api.payment.mock-complete.ts"),
  route("api/subscription", "routes/api.subscription.ts"),
  // 用户功能 API
  route("api/daily-signin", "routes/api.daily-signin.ts"),
  route("api/shop/purchase", "routes/api.shop.purchase.ts"),
  // AI API 路由
  route("api/ai/chat", "routes/api.ai.chat.ts"),
  route("api/ai/summary", "routes/api.ai.summary.ts"),
  route("api/ai/writing", "routes/api.ai.writing.ts"),
  route("api/ai/moderate", "routes/api.ai.moderate.ts"),
  route("api/ai/seo", "routes/api.ai.seo.ts"),
  route("api/ai/tags", "routes/api.ai.tags.ts"),
  route("api/ai/search", "routes/api.ai.search.ts"),
  route("api/ai/recommend", "routes/api.ai.recommend.ts"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  // 404 页面
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
