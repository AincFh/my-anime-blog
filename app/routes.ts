import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ---------------- 前端页面视图层 (Frontend Views Layer) ----------------

  // 核心公众页面
  index("pages/public/home.tsx"),
  route("articles", "pages/public/articles.tsx"),
  route("articles/:slug", "pages/public/articles.$slug.tsx"),
  route("archive", "pages/public/archive.tsx"),
  route("gallery", "pages/public/gallery.tsx"),
  route("bangumi", "pages/public/bangumi.tsx"),
  route("bangumi/:id", "pages/public/bangumi.$id.tsx"),

  // SEO & XML
  route("atom.xml", "pages/public/atom.xml.tsx"),
  route("rss.xml", "pages/public/rss.xml.tsx"),
  route("sitemap.xml", "pages/public/sitemap[.]xml.ts"),
  route("robots.txt", "pages/public/robots[.]txt.ts"),

  // 用户认证
  route("login", "pages/auth/login.tsx"),
  route("register", "pages/auth/register.tsx"),
  route("forgot-password", "pages/auth/forgot-password.tsx"),
  route("logout", "pages/auth/logout.tsx"),

  // 法律与声明
  route("privacy", "pages/legal/privacy.tsx"),
  route("terms", "pages/legal/terms.tsx"),
  route("disclaimer", "pages/legal/disclaimer.tsx"),
  route("legal/sponsor", "pages/legal/legal.sponsor.tsx"),
  route("legal/privacy", "pages/legal/legal.privacy.tsx"),

  // 独立后台 (Admin Dashboard)
  route("panel/login", "pages/admin/admin.login.tsx"),
  route("panel/logout", "pages/admin/admin.logout.tsx"),
  route("admin", "pages/admin/admin.tsx", [
    route("article/new", "pages/admin/admin.article.new.tsx"),
    route("anime/manage", "pages/admin/admin.anime.manage.tsx"),
    route("articles", "pages/admin/admin.articles.tsx"),
    route("comments", "pages/admin/admin.comments.tsx"),
    route("gallery", "pages/admin/admin.gallery.tsx"),
    route("settings", "pages/admin/admin.settings.tsx"),
    route("tags", "pages/admin/admin.tags.tsx"),
    route("analytics", "pages/admin/admin.analytics.tsx"),
    route("users", "pages/admin/admin.users.tsx"),
    route("missions", "pages/admin/admin.missions.tsx"),
    route("shop", "pages/admin/admin.shop.tsx"),
    route("membership", "pages/admin/admin.membership.tsx"),
    route("cleanup", "pages/admin/admin.cleanup.tsx"),
    route("*", "pages/admin/admin.404.tsx"),
  ]),

  // 用户中心 (HUB / Game HUD) - 布局嵌套
  route("/", "pages/user/_game.tsx", [
    route("user/dashboard", "pages/user/user.dashboard.tsx"),
    route("user/inventory", "pages/user/user.inventory.tsx"),
    route("user/achievements", "pages/user/user.achievements.tsx"),
    route("settings", "pages/user/settings.tsx"),
    route("shop", "pages/user/shop.tsx"),
    route("user/membership", "pages/user/user.membership.tsx"),
    route("wallet", "pages/user/wallet.tsx"),
  ]),

  // ---------------- 纯后端接口层 (Backend API Layer) ----------------

  // AI 智能引擎
  route("api/ai/chat", "api/ai/api.ai.chat.ts"),
  route("api/ai/summary", "api/ai/api.ai.summary.ts"),
  route("api/ai/writing", "api/ai/api.ai.writing.ts"),
  route("api/ai/moderate", "api/ai/api.ai.moderate.ts"),
  route("api/ai/seo", "api/ai/api.ai.seo.ts"),
  route("api/ai/tags", "api/ai/api.ai.tags.ts"),
  route("api/ai/search", "api/ai/api.ai.search.ts"),
  route("api/ai/recommend", "api/ai/api.ai.recommend.ts"),

  // 后端鉴权服务
  route("api/auth/login", "api/auth/api.auth.login.ts"),
  route("api/auth/register", "api/auth/api.auth.register.ts"),
  route("api/auth/send-code", "api/auth/api.auth.send-code.ts"),

  // 用户服务接口
  route("api/user/me", "api/user/api.user.me.ts"),
  route("api/user/purchases", "api/user/api.user.purchases.ts"),
  route("api/daily-signin", "api/user/api.daily-signin.ts"),

  // 管理员与评论治理
  route("api/admin/comments", "api/admin/api.admin.comments.ts"),
  route("api/admin/purge-cache", "api/admin/api.admin.purge-cache.tsx"),
  route("api/admin/change-password", "api/admin/api.admin.change-password.tsx"),
  route("api/comments", "api/comments/api.comments.tsx"),

  // 结算与经济循环
  route("api/payment/callback", "api/payment/api.payment.callback.ts"),
  route("api/payment/mock-complete", "api/payment/api.payment.mock-complete.ts"),
  route("api/subscription", "api/payment/api.subscription.ts"),
  route("api/shop/purchase", "api/payment/api.shop.purchase.ts"),
  route("api/wallet", "api/wallet/api.wallet.ts"),
  route("api/wallet/recharge", "api/wallet/api.wallet.recharge.ts"),

  // 上传与云存储
  route("api/upload", "api/misc/api.upload.ts"),
  route("api/r2/*", "api/misc/api.r2.$.ts"),

  // 追番与动漫网关
  route("api/bangumi/search", "api/bangumi/api.bangumi.search.ts"),
  route("api/bangumi/detail", "api/bangumi/api.bangumi.detail.ts"),
  route("api/animes", "api/misc/api.animes.ts"),

  // 杂项
  route("action/set-theme", "api/misc/action.set-theme.ts"),
  route("api/og", "api/misc/api.og.tsx"),
  route("api/achievement", "api/misc/api.achievement.tsx"),

  // 全局 404 兜底
  route("*", "pages/error/404.tsx"),
] satisfies RouteConfig;
