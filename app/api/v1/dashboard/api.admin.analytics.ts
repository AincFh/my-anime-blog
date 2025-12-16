/**
 * 网站数据分析API
 * 提供关键指标查询和数据分析功能
 */

import type { Route } from "./+types/api.admin.analytics";
import { queryAll, queryFirst } from "~/services/db.server";
import { requireAdmin } from "~/utils/auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;
  
  // 验证管理员权限
  const session = await requireAdmin(request, anime_db);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "overview";

  try {
    switch (type) {
      case "overview":
        return await getOverviewStats(anime_db);
      case "content":
        return await getContentAnalytics(anime_db);
      case "user":
        return await getUserAnalytics(anime_db);
      case "traffic":
        return await getTrafficAnalytics(anime_db);
      case "engagement":
        return await getEngagementAnalytics(anime_db);
      default:
        return new Response("Invalid analytics type", { status: 400 });
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 获取概览统计数据
async function getOverviewStats(db: any) {
  const stats = await queryFirst(db, `
    SELECT 
      (SELECT COUNT(*) FROM articles WHERE status = 'published') as total_articles,
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM comments WHERE status = 'approved') as total_comments,
      (SELECT COUNT(*) FROM animes) as total_animes,
      (SELECT SUM(views) FROM articles WHERE status = 'published') as total_views,
      (SELECT SUM(likes) FROM articles WHERE status = 'published') as total_likes
  `);

  // 获取最近7天趋势（需要user_analytics表支持）
  const weeklyTrend = await queryAll(db, `
    SELECT 
      DATE(created_at, 'unixepoch') as date,
      COUNT(*) as page_views,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_analytics 
    WHERE created_at >= unixepoch('now', '-7 days')
    GROUP BY date
    ORDER BY date DESC
  `);

  return {
    stats,
    weeklyTrend,
    timestamp: Date.now()
  };
}

// 内容分析
async function getContentAnalytics(db: any) {
  // 热门文章排行
  const topArticles = await queryAll(db, `
    SELECT 
      a.title,
      a.slug,
      a.views,
      a.likes,
      a.category,
      COUNT(c.id) as comment_count,
      CASE 
        WHEN a.views > 0 THEN (a.likes * 100.0 / a.views)
        ELSE 0 
      END as like_rate
    FROM articles a
    LEFT JOIN comments c ON a.id = c.article_id AND c.status = 'approved'
    WHERE a.status = 'published'
    GROUP BY a.id
    ORDER BY a.views DESC
    LIMIT 10
  `);

  // 分类表现
  const categoryStats = await queryAll(db, `
    SELECT 
      category,
      COUNT(*) as article_count,
      SUM(views) as total_views,
      AVG(views) as avg_views,
      SUM(likes) as total_likes,
      CASE 
        WHEN SUM(views) > 0 THEN (SUM(likes) * 100.0 / SUM(views))
        ELSE 0 
      END as avg_like_rate
    FROM articles 
    WHERE status = 'published' AND category IS NOT NULL
    GROUP BY category
    ORDER BY total_views DESC
  `);

  // 标签分析
  const tagAnalysis = await queryAll(db, `
    SELECT 
      json_extract(value, '$') as tag,
      COUNT(*) as usage_count,
      AVG(views) as avg_views
    FROM articles, json_each(json_array(tags))
    WHERE status = 'published' AND tags IS NOT NULL
    GROUP BY tag
    ORDER BY usage_count DESC
    LIMIT 20
  `);

  return {
    topArticles,
    categoryStats,
    tagAnalysis,
    timestamp: Date.now()
  };
}

// 用户分析
async function getUserAnalytics(db: any) {
  // 用户增长趋势
  const userGrowth = await queryAll(db, `
    SELECT 
      DATE(created_at, 'unixepoch') as date,
      COUNT(*) as new_users,
      SUM(COUNT(*)) OVER (ORDER BY date) as cumulative_users
    FROM users 
    WHERE created_at >= unixepoch('now', '-30 days')
    GROUP BY date
    ORDER BY date DESC
  `);

  // 用户活跃度分析
  const userActivity = await queryFirst(db, `
    SELECT 
      COUNT(DISTINCT user_id) as active_users_7d,
      COUNT(DISTINCT CASE WHEN created_at >= unixepoch('now', '-1 day') THEN user_id END) as active_users_1d,
      AVG(level) as avg_level,
      AVG(exp) as avg_exp,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
    FROM users u
    LEFT JOIN user_analytics ua ON u.id = ua.user_id
    WHERE ua.created_at >= unixepoch('now', '-7 days') OR u.created_at >= unixepoch('now', '-7 days')
  `);

  // RPG系统参与度
  const rpgStats = await queryAll(db, `
    SELECT 
      level,
      COUNT(*) as user_count,
      AVG(exp) as avg_exp,
      AVG(coins) as avg_coins,
      COUNT(CASE WHEN achievements IS NOT NULL AND achievements != '[]' THEN 1 END) as has_achievements
    FROM users 
    GROUP BY level
    ORDER BY level DESC
    LIMIT 10
  `);

  return {
    userGrowth,
    userActivity,
    rpgStats,
    timestamp: Date.now()
  };
}

// 流量分析
async function getTrafficAnalytics(db: any) {
  // 页面访问排行
  const pageViews = await queryAll(db, `
    SELECT 
      page_url,
      COUNT(*) as total_views,
      COUNT(DISTINCT user_id) as unique_visitors,
      AVG(duration) as avg_duration,
      COUNT(CASE WHEN referrer IS NOT NULL AND referrer != '' THEN 1 END) as with_referrer
    FROM user_analytics 
    WHERE created_at >= unixepoch('now', '-30 days')
    GROUP BY page_url
    ORDER BY total_views DESC
    LIMIT 20
  `);

  // 来源分析
  const referrerStats = await queryAll(db, `
    SELECT 
      CASE 
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%baidu%' THEN 'Baidu'
        WHEN referrer LIKE '%bilibili%' THEN 'Bilibili'
        ELSE 'Other'
      END as source,
      COUNT(*) as visit_count,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(duration) as avg_duration
    FROM user_analytics 
    WHERE created_at >= unixepoch('now', '-30 days')
    GROUP BY source
    ORDER BY visit_count DESC
  `);

  return {
    pageViews,
    referrerStats,
    timestamp: Date.now()
  };
}

// 互动参与度分析
async function getEngagementAnalytics(db: any) {
  // 评论活跃度
  const commentActivity = await queryAll(db, `
    SELECT 
      DATE(created_at, 'unixepoch') as date,
      COUNT(*) as comment_count,
      COUNT(DISTINCT user_id) as unique_commenters,
      COUNT(CASE WHEN is_danmaku = 1 THEN 1 END) as danmaku_count
    FROM comments 
    WHERE status = 'approved' AND created_at >= unixepoch('now', '-30 days')
    GROUP BY date
    ORDER BY date DESC
  `);

  // 互动质量分析
  const engagementQuality = await queryFirst(db, `
    SELECT 
      AVG(CASE WHEN c.status = 'approved' THEN 1.0 ELSE 0 END) as approval_rate,
      COUNT(DISTINCT c.user_id) as active_commenters,
      COUNT(DISTINCT a.user_id) as active_article_authors,
      AVG(LENGTH(c.content)) as avg_comment_length
    FROM comments c
    LEFT JOIN articles a ON c.article_id = a.id
    WHERE c.created_at >= unixepoch('now', '-30 days')
  `);

  return {
    commentActivity,
    engagementQuality,
    timestamp: Date.now()
  };
}