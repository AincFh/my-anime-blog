/**
 * 增强版数据分析仪表盘组件
 * 集成实时数据分析和可视化
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";

interface AnalyticsData {
  overview?: {
    stats: {
      total_articles: number;
      total_users: number;
      total_comments: number;
      total_animes: number;
      total_views: number;
      total_likes: number;
    };
    weeklyTrend: Array<{
      date: string;
      page_views: number;
      unique_users: number;
    }>;
  };
  content?: {
    topArticles: Array<{
      title: string;
      views: number;
      likes: number;
      like_rate: number;
      comment_count: number;
    }>;
    categoryStats: Array<{
      category: string;
      article_count: number;
      total_views: number;
      avg_like_rate: number;
    }>;
  };
  user?: {
    userGrowth: Array<{
      date: string;
      new_users: number;
    }>;
    userActivity: {
      active_users_7d: number;
      active_users_1d: number;
      avg_level: number;
    };
  };
}

export function EnhancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 并行获取所有分析数据
      const [overview, content, user] = await Promise.all([
        fetch(`/api/admin/analytics?type=overview&range=${selectedTimeRange}`).then(r => r.json()),
        fetch(`/api/admin/analytics?type=content&range=${selectedTimeRange}`).then(r => r.json()),
        fetch(`/api/admin/analytics?type=user&range=${selectedTimeRange}`).then(r => r.json())
      ]);

      setData({ overview, content, user });
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="space-y-6">
      {/* 概览统计卡片 */}
      {data.overview?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="总文章数"
            value={data.overview.stats.total_articles}
            icon="📝"
            color="#3B82F6"
          />
          <StatCard
            title="总用户数"
            value={data.overview.stats.total_users}
            icon="👥"
            color="#10B981"
          />
          <StatCard
            title="总评论数"
            value={data.overview.stats.total_comments}
            icon="💬"
            color="#F59E0B"
          />
          <StatCard
            title="总浏览量"
            value={data.overview.stats.total_views}
            icon="👁️"
            color="#EF4444"
          />
          <StatCard
            title="总点赞数"
            value={data.overview.stats.total_likes}
            icon="❤️"
            color="#EC4899"
          />
          <StatCard
            title="番剧记录"
            value={data.overview.stats.total_animes}
            icon="📺"
            color="#8B5CF6"
          />
        </div>
      )}

      {/* 流量趋势图 */}
      {data.overview?.weeklyTrend && (
        <Card>
          <CardHeader>
            <CardTitle>流量趋势分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.overview.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="page_views" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="页面浏览量"
                />
                <Area 
                  type="monotone" 
                  dataKey="unique_users" 
                  stackId="2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="独立访客"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门内容排行 */}
        {data.content?.topArticles && (
          <Card>
            <CardHeader>
              <CardTitle>热门内容TOP10</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.content.topArticles.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#3B82F6" name="浏览量" />
                  <Bar dataKey="likes" fill="#EC4899" name="点赞数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 分类表现分析 */}
        {data.content?.categoryStats && (
          <Card>
            <CardHeader>
              <CardTitle>分类表现分析</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.content.categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_views"
                  >
                    {data.content.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 用户增长趋势 */}
      {data.user?.userGrowth && (
        <Card>
          <CardHeader>
            <CardTitle>用户增长趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.user.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="new_users" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="新增用户"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 数据洞察卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title="内容质量洞察"
          description="基于点赞率和评论活跃度分析内容表现"
          insights={[
            "高点赞率内容特征分析",
            "用户参与度趋势预测",
            "内容发布时间优化建议"
          ]}
          color="blue"
        />
        <InsightCard
          title="用户行为洞察"
          description="分析用户活跃度和参与度模式"
          insights={[
            "用户留存率分析",
            "RPG系统参与度评估",
            "用户生命周期价值预测"
          ]}
          color="green"
        />
        <InsightCard
          title="流量来源洞察"
          description="分析访客来源和转化路径"
          insights={[
            "搜索引擎优化建议",
            "社交媒体传播效果",
            "直接访问用户特征分析"
          ]}
          color="purple"
        />
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: string; 
  color: string; 
}) {
  return (
    <motion.div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  );
}

// 洞察卡片组件
function InsightCard({ 
  title, 
  description, 
  insights, 
  color 
}: { 
  title: string; 
  description: string; 
  insights: string[]; 
  color: string; 
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800"
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorMap[color as keyof typeof colorMap]}`}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-75 mb-3">{description}</p>
      <ul className="space-y-1">
        {insights.map((insight, index) => (
          <li key={index} className="text-sm flex items-start">
            <span className="mr-2">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}