import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Route } from "./+types/admin.settings";
import { redirect, useSubmit, useNavigation } from "react-router";
import { requireAdmin } from "~/utils/auth";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import type { SystemSettings } from "~/contexts/SettingsContext";
import { Save, RefreshCw, Settings as SettingsIcon, Palette, Box, Link as LinkIcon, Shield, Info, Check } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { getDB } = await import("~/utils/db");
  const db = getDB(context);

  // 验证管理员权限
  const session = await requireAdmin(request, db);
  if (!session) {
    throw redirect("/panel/login");
  }

  try {
    const env = (context as any).cloudflare.env;
    const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";

    // 生成 CSRF Token
    const { generateCSRFToken } = await import("~/services/security/csrf.server");
    const csrfToken = await generateCSRFToken(session.sessionId, env.CACHE_KV, secret);

    // 从数据库读取配置JSON
    const result = await db
      .prepare("SELECT config_json FROM system_settings WHERE id = 1")
      .first<{ config_json: string }>();

    if (result && result.config_json) {
      return { settings: JSON.parse(result.config_json), csrfToken };
    }
    return { settings: null, csrfToken };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return { settings: null, csrfToken: "" };
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { getDB } = await import("~/utils/db");
  const db = getDB(context);

  // 验证管理员权限
  const session = await requireAdmin(request, db);
  if (!session) {
    throw redirect("/panel/login");
  }

  const formData = await request.formData();
  const configJson = formData.get("config_json") as string;
  const csrfToken = formData.get("_csrf") as string;

  // 验证 CSRF Token
  const env = (context as any).cloudflare.env;

  const secret = env.CSRF_SECRET;
  if (!secret) {
    console.error("Critical Security Error: CSRF_SECRET is not set.");
    return { success: false, error: "系统安全配置错误: 缺少 CSRF 密钥" };
  }
  const { validateCSRFToken } = await import("~/services/security/csrf.server");

  const csrfResult = await validateCSRFToken(csrfToken, session.sessionId, env.CACHE_KV, secret);
  if (!csrfResult.valid) {
    return { success: false, error: "安全验证失败 (CSRF): " + csrfResult.error };
  }

  try {
    // 更新或插入配置
    await db
      .prepare(
        `INSERT INTO system_config (id, config_json) 
         VALUES (1, ?) 
         ON CONFLICT(id) DO UPDATE SET config_json = ?`
      )
      .bind(configJson, configJson)
      .run();

    return { success: true, message: "Settings saved successfully" };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

const defaultSettings: SystemSettings = {
  site_title: "Project Blue Sky",
  site_description: "沉浸式二次元个人终端",
  keywords: "二次元, React, 博客",
  master_name: "Master",
  avatar_url: "",
  bio: "欢迎来到我的二次元基地",
  footer_text: "© 2024 Project Blue Sky",
  start_year: 2024,
  theme: {
    default_wallpaper: "",
    dark_mode_wallpaper: "",
    overlay_opacity: 0.3,
    primary_color: "#6366f1",
    radius: "large",
    enable_particles: true,
    enable_blur: true,
    gray_mode: false,
  },
  features: {
    live2d: {
      enabled: false,
      model_source: "",
      position: "bottom-left",
    },
    music: {
      auto_play: false,
      playlist_id: "",
      volume: 50,
    },
    comments: {
      enabled: true,
      enable_danmaku: true,
      review_required: true,
    },
  },
  integrations: {
    social: {
      github: "",
      bilibili: "",
      twitter: "",
    },
    r2: {
      upload_path: "uploads/",
    },
  },
  security: {
    maintenance_mode: false,
  },
  god_mode: {
    enabled: false,
    fake_total_views_offset: 0,
    fake_user_count_offset: 0,
    simulated_online_users_min: 10,
    simulated_online_users_max: 50,
    uptime_override_days: 0,
  },
};

type SettingsTab = "basic" | "theme" | "features" | "integrations" | "security" | "god" | "about";

// 深度合并对象，确保不会出现 undefined 属性导致崩溃
function mergeSettings(defaultObj: any, dbObj: any): SystemSettings {
  if (!dbObj) return defaultObj;
  const result = { ...defaultObj };
  for (const key in result) {
    if (dbObj.hasOwnProperty(key)) {
      if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        result[key] = { ...result[key], ...dbObj[key] };
      } else {
        result[key] = dbObj[key];
      }
    }
  }
  return result as SystemSettings;
}

export default function Settings({ loaderData, actionData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("basic");

  const initialSettings = mergeSettings(defaultSettings, loaderData.settings);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info" | "warning">("success");
  const [isSaving, setIsSaving] = useState(false);

  const submit = useSubmit();
  const navigation = useNavigation();

  // 检测是否有未保存的修改
  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(initialSettings));
  }, [settings, initialSettings]);

  // 显示actionData的消息
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setToastType("success");
        setToastMessage(actionData.message || "已保存");
      } else {
        setToastType("error");
        setToastMessage(actionData.error || "保存失败");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [actionData]);

  const handleSave = () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("config_json", JSON.stringify(settings));
    if (loaderData.csrfToken) {
      formData.append("_csrf", loaderData.csrfToken);
    }
    submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (navigation.state === "idle" && isSaving) {
      setIsSaving(false);
      setHasChanges(false);
    }
  }, [navigation.state, isSaving]);

  const handleReset = () => {
    if (confirm("确定要重置为上次保存的状态吗？")) {
      setSettings(loaderData.settings || defaultSettings);
      setHasChanges(false);
    }
  };

  const tabs = [
    { key: "basic", label: "基础设置", icon: <SettingsIcon size={18} />, description: "站点核心信息" },
    { key: "theme", label: "外观主题", icon: <Palette size={18} />, description: "视觉样式与配色" },
    { key: "features", label: "功能模块", icon: <Box size={18} />, description: "功能开关与配置" },
    { key: "integrations", label: "第三方连接", icon: <LinkIcon size={18} />, description: "外部服务集成" },
    { key: "security", label: "安全与备份", icon: <Shield size={18} />, description: "访问控制与数据" },
    { key: "god", label: "上帝模式", icon: <ShieldAlert size={18} className="text-amber-500" />, description: "原子级统计篡改" },
    { key: "about", label: "关于系统", icon: <Info size={18} />, description: "版本与技术栈" },
  ];

  const ToggleSwitch = ({ enabled, onChange, label, description }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      <div className="flex-1 pr-6">
        <span className="text-sm font-semibold text-white/90">{label}</span>
        {description && <span className="text-xs text-white/40">{description}</span>}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${enabled ? "bg-violet-500" : "bg-white/20"}`}
        >
          <motion.div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm border border-slate-100/50`}
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    </label>
  );

  return (
    <div className="w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron">系统设置</h1>
          <p className="text-white/50 text-sm mt-1">管理系统配置与偏好设置</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hasChanges && (
            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
              有未保存的修改
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${hasChanges ? "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15" : "opacity-50 cursor-not-allowed bg-white/5 text-white/30 border border-white/10"
              }`}
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">重置</span>
          </button>
          <motion.button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${hasChanges
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-violet-500/40 text-white active:scale-95"
              : "opacity-40 cursor-not-allowed bg-white/10 text-white/30 border border-white/5"
              }`}
            whileHover={hasChanges ? { scale: 1.05 } : {}}
          >
            <Save size={16} className={isSaving ? "animate-spin" : ""} />
            <span>{isSaving ? "SYNCING..." : "保存系统镜像"}</span>
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as SettingsTab)}
                className={`py-2 px-4 rounded-xl text-left transition-all flexitems-center gap-3 whitespace-nowrap ${activeTab === tab.key
                  ? "bg-violet-500/15 border border-violet-500/30 text-violet-300 font-medium shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70 font-medium"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={activeTab === tab.key ? "text-violet-400" : "text-white/40"}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card-deep tech-border rounded-2xl p-6 md:p-8"
            >
              {/* General Settings */}
              {activeTab === "basic" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-6 tracking-tight">基础信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                          站点标题 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.site_title}
                          onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                          placeholder="Project Blue Sky"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                          站长名称
                        </label>
                        <input
                          type="text"
                          value={settings.master_name}
                          onChange={(e) => setSettings({ ...settings, master_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                          placeholder="Master"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      SEO 描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all resize-none text-sm"
                      placeholder="搜索引擎的网站描述..."
                    />
                    <div className="text-xs text-white/30 mt-2 flex justify-end">
                      {settings.site_description.length} / 160
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      关键词
                    </label>
                    <input
                      type="text"
                      value={settings.keywords}
                      onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                      placeholder="二次元, React, 博客（逗号分隔）"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                    />
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">头像链接</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="url"
                          value={settings.avatar_url}
                          onChange={(e) => setSettings({ ...settings, avatar_url: e.target.value })}
                          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                          placeholder="https://..."
                        />
                        {settings.avatar_url && (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                            <OptimizedImage src={settings.avatar_url} alt="头像" className="w-full h-full object-cover" width={40} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">建站年份</label>
                      <input
                        type="number"
                        value={settings.start_year}
                        onChange={(e) => setSettings({ ...settings, start_year: parseInt(e.target.value) || 2024 })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">个人签名</label>
                    <input
                      type="text"
                      value={settings.bio}
                      onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                      placeholder="欢迎来到我的二次元基地"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">页脚文字</label>
                      <input
                        type="text"
                        value={settings.footer_text}
                        onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">ICP 备案号</label>
                      <input
                        type="text"
                        value={settings.icp_number || ""}
                        onChange={(e) => setSettings({ ...settings, icp_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                        placeholder="选填"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === "theme" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold text-white mb-6 tracking-tight">外观主题</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">默认壁纸链接</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="url"
                          value={settings.theme.default_wallpaper}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, default_wallpaper: e.target.value }
                          })}
                          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                          placeholder="https://..."
                        />
                        {settings.theme.default_wallpaper && (
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <OptimizedImage
                              src={settings.theme.default_wallpaper}
                              alt="预览"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              width={64}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">深色模式壁纸链接</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="url"
                          value={settings.theme.dark_mode_wallpaper}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, dark_mode_wallpaper: e.target.value }
                          })}
                          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                          placeholder="https://..."
                        />
                        {settings.theme.dark_mode_wallpaper && (
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <OptimizedImage
                              src={settings.theme.dark_mode_wallpaper}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              width={64}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2 flex justify-between">
                        <span>遮罩透明度</span>
                        <span className="text-indigo-600 font-bold">{Math.round(settings.theme.overlay_opacity * 100)}%</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.1"
                          value={settings.theme.overlay_opacity}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, overlay_opacity: parseFloat(e.target.value) }
                          })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium">
                          <span>10%</span>
                          <span>50%</span>
                          <span>90%</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/10" />

                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-3">主题色</label>
                      <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap">
                          {[
                            { name: "Indigo", value: "#4f46e5" },
                            { name: "Blue", value: "#2563eb" },
                            { name: "Emerald", value: "#10b981" },
                            { name: "Rose", value: "#e11d48" },
                            { name: "Amber", value: "#d97706" },
                          ].map((color) => (
                            <button
                              type="button"
                              key={color.value}
                              onClick={() => setSettings({
                                ...settings,
                                theme: { ...settings.theme, primary_color: color.value }
                              })}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${settings.theme.primary_color === color.value ? "scale-110 shadow-md ring-2 ring-offset-2 ring-slate-300" : "hover:scale-110"
                                }`}
                              style={{ backgroundColor: color.value }}
                            >
                              {settings.theme.primary_color === color.value && <Check size={16} className="text-white drop-shadow" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/10" />

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-white/80 mb-3">特效</label>
                      <div className="divide-y divide-slate-100">
                        <ToggleSwitch
                          enabled={settings.theme.enable_particles}
                          onChange={(v) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, enable_particles: v }
                          })}
                          label="粒子特效"
                          description="背景环境粒子动画（关闭可提升性能）"
                        />
                        <ToggleSwitch
                          enabled={settings.theme.enable_blur}
                          onChange={(v) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, enable_blur: v }
                          })}
                          label="毛玻璃效果"
                          description="高质量背景模糊（CSS backdrop-filter）"
                        />
                        <ToggleSwitch
                          enabled={settings.theme.gray_mode}
                          onChange={(v) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, gray_mode: v }
                          })}
                          label="灰度模式"
                          description="全站去色（如哀悼日使用）"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* 功能模块 */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white font-orbitron">功能模块</h2>
                    <div className="text-sm text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      🧩 功能开关与配置
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-violet-500/5 rounded-2xl border border-violet-500/20">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🎭</span>
                        <span>Live2D 看板娘</span>
                      </h3>
                      <div className="space-y-4">
                        <ToggleSwitch
                          enabled={settings.features.live2d.enabled}
                          onChange={(v) => setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              live2d: { ...settings.features.live2d, enabled: v }
                            }
                          })}
                          label="启用 Live2D"
                          description="在首页显示看板娘"
                        />
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">模型 JSON 链接</label>
                          <input
                            type="url"
                            value={settings.features.live2d.model_source}
                            onChange={(e) => setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                live2d: { ...settings.features.live2d, model_source: e.target.value }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">位置</label>
                          <select
                            value={settings.features.live2d.position}
                            onChange={(e) => setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                live2d: { ...settings.features.live2d, position: e.target.value as any }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                          >
                            <option value="bottom-left">左下</option>
                            <option value="bottom-right">右下</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🎵</span>
                        <span>音乐播放器</span>
                      </h3>
                      <div className="space-y-4">
                        <ToggleSwitch
                          enabled={settings.features.music.auto_play}
                          onChange={(v) => setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              music: { ...settings.features.music, auto_play: v }
                            }
                          })}
                          label="自动播放"
                          description="页面加载时自动播放（浏览器可能拦截）"
                        />
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">播放列表 ID</label>
                          <input
                            type="text"
                            value={settings.features.music.playlist_id}
                            onChange={(e) => setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                music: { ...settings.features.music, playlist_id: e.target.value }
                              }
                            })}
                            placeholder="网易云/Spotify 歌单 ID"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">
                            默认音量: <span className="text-violet-400 font-bold">{settings.features.music.volume}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.features.music.volume}
                            onChange={(e) => setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                music: { ...settings.features.music, volume: parseInt(e.target.value) }
                              }
                            })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>💬</span>
                        <span>评论与弹幕</span>
                      </h3>
                      <div className="space-y-4">
                        <ToggleSwitch
                          enabled={settings.features.comments.enabled}
                          onChange={(v) => setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              comments: { ...settings.features.comments, enabled: v }
                            }
                          })}
                          label="启用评论"
                          description="允许访客发表评论"
                        />
                        <ToggleSwitch
                          enabled={settings.features.comments.enable_danmaku}
                          onChange={(v) => setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              comments: { ...settings.features.comments, enable_danmaku: v }
                            }
                          })}
                          label="允许弹幕模式"
                          description="评论可以以弹幕形式飘过屏幕"
                        />
                        <ToggleSwitch
                          enabled={settings.features.comments.review_required}
                          onChange={(v) => setSettings({
                            ...settings,
                            features: {
                              ...settings.features,
                              comments: { ...settings.features.comments, review_required: v }
                            }
                          })}
                          label="评论需要审核"
                          description="新评论需要管理员批准后才显示"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations */}
              {activeTab === "integrations" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">第三方连接</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">统计分析</h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">Google Analytics ID</label>
                          <input type="text" value={settings.integrations.google_analytics_id || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, google_analytics_id: e.target.value } })} placeholder="G-XXXXX" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">Cloudflare Web Analytics Token</label>
                          <input type="text" value={settings.integrations.cloudflare_analytics_token || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, cloudflare_analytics_token: e.target.value } })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" placeholder="From Cloudflare Dashboard" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">社交媒体</h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">GitHub</label>
                          <input type="url" value={settings.integrations.social.github || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, social: { ...settings.integrations.social, github: e.target.value } } })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" placeholder="https://github.com/..." />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">Bilibili</label>
                          <input type="url" value={settings.integrations.social.bilibili || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, social: { ...settings.integrations.social, bilibili: e.target.value } } })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" placeholder="https://space.bilibili.com/..." />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">X / Twitter</label>
                          <input type="url" value={settings.integrations.social.twitter || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, social: { ...settings.integrations.social, twitter: e.target.value } } })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" placeholder="https://x.com/..." />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">对象存储 (R2)</h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">公开访问域名</label>
                          <input type="text" value={settings.integrations.r2.public_domain || ""} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, r2: { ...settings.integrations.r2, public_domain: e.target.value } } })} placeholder="img.example.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">上传路径前缀</label>
                          <input type="text" value={settings.integrations.r2.upload_path} onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, r2: { ...settings.integrations.r2, upload_path: e.target.value } } })} placeholder="uploads/" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* God Mode Override */}
              {activeTab === "god" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-500/20">
                    <div>
                      <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <ShieldAlert className="text-amber-500 w-8 h-8" />
                        GOD MODE: PROTOCOL OVERWRITE
                      </h2>
                      <p className="text-amber-500/50 text-xs font-mono mt-1">权限级别: 最高。正在绕过真实数据校验层...</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <ToggleSwitch
                      enabled={settings.god_mode?.enabled || false}
                      onChange={(v) => setSettings({
                        ...settings,
                        god_mode: { ...(settings.god_mode || defaultSettings.god_mode), enabled: v }
                      })}
                      label="激活全局篡改协议"
                      description="开启后，前台显示的统计数据将应用下方的偏移量方案。"
                    />

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${settings.god_mode?.enabled ? "opacity-100" : "opacity-30 pointer-events-none grayscale"}`}>
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total Views Injection (PV)</label>
                        <div className="flex items-center gap-3">
                          <span className="text-white/20 text-xs font-mono">Real + </span>
                          <input
                            type="number"
                            value={settings.god_mode?.fake_total_views_offset || 0}
                            onChange={(e) => setSettings({
                              ...settings,
                              god_mode: { ...(settings.god_mode || defaultSettings.god_mode), fake_total_views_offset: parseInt(e.target.value) || 0 }
                            })}
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-xl"
                          />
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Registration Inflation (Users)</label>
                        <div className="flex items-center gap-3">
                          <span className="text-white/20 text-xs font-mono">Real + </span>
                          <input
                            type="number"
                            value={settings.god_mode?.fake_user_count_offset || 0}
                            onChange={(e) => setSettings({
                              ...settings,
                              god_mode: { ...(settings.god_mode || defaultSettings.god_mode), fake_user_count_offset: parseInt(e.target.value) || 0 }
                            })}
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-blue-400 font-mono text-xl"
                          />
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 md:col-span-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Online User Simulation (Real-time)</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] text-white/20">MIN RANGE</span>
                            <input
                              type="number"
                              value={settings.god_mode?.simulated_online_users_min || 0}
                              onChange={(e) => setSettings({
                                ...settings,
                                god_mode: { ...(settings.god_mode || defaultSettings.god_mode), simulated_online_users_min: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] text-white/20">MAX RANGE</span>
                            <input
                              type="number"
                              value={settings.god_mode?.simulated_online_users_max || 0}
                              onChange={(e) => setSettings({
                                ...settings,
                                god_mode: { ...(settings.god_mode || defaultSettings.god_mode), simulated_online_users_max: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Uptime Override (Days)</label>
                        <input
                          type="number"
                          value={settings.god_mode?.uptime_override_days || 0}
                          onChange={(e) => setSettings({
                            ...settings,
                            god_mode: { ...(settings.god_mode || defaultSettings.god_mode), uptime_override_days: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-amber-400 font-mono text-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security & Operations */}
              {activeTab === "security" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">安全与备份</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">访问控制</h3>
                      <div className="space-y-6">
                        <ToggleSwitch
                          enabled={settings.security.maintenance_mode}
                          onChange={(v) => setSettings({ ...settings, security: { ...settings.security, maintenance_mode: v } })}
                          label="维护模式"
                          description="开启后前台只显示施工中页面，其他人无法访问"
                        />
                        <div className="h-px w-full bg-white/10" />
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-3">修改后台密码</label>
                          <div className="space-y-3 max-w-md">
                            <input type="password" id="current-password" placeholder="当前密码" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                            <input type="password" id="new-password" placeholder="新密码（至少8位）" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                            <input type="password" id="confirm-password" placeholder="确认新密码" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all text-sm" />
                            <button
                              onClick={async () => {
                                const currentPassword = (document.getElementById("current-password") as HTMLInputElement)?.value;
                                const newPassword = (document.getElementById("new-password") as HTMLInputElement)?.value;
                                const confirmPassword = (document.getElementById("confirm-password") as HTMLInputElement)?.value;
                                if (!currentPassword || !newPassword || !confirmPassword) { setToastType("error"); setToastMessage("请填写所有密码字段"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); return; }
                                if (newPassword.length < 8) { setToastType("error"); setToastMessage("新密码至少需要8位"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); return; }
                                if (newPassword !== confirmPassword) { setToastType("error"); setToastMessage("两次输入的密码不一致"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); return; }
                                try {
                                  const formData = new FormData();
                                  formData.append("current_password", currentPassword);
                                  formData.append("new_password", newPassword);
                                  formData.append("confirm_password", confirmPassword);
                                  const response = await fetch("/api/admin/change-password", { method: "POST", body: formData });
                                  const result = await response.json() as { success: boolean, message?: string, error?: string };
                                  if (result.success) {
                                    setToastType("success"); setToastMessage(result.message || "密码修改成功"); setShowToast(true);
                                    setTimeout(() => { setShowToast(false); (document.getElementById("current-password") as HTMLInputElement).value = ""; (document.getElementById("new-password") as HTMLInputElement).value = ""; (document.getElementById("confirm-password") as HTMLInputElement).value = ""; }, 3000);
                                  } else { setToastType("error"); setToastMessage(result.error || "密码修改失败"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                                } catch (error) { setToastType("error"); setToastMessage("密码修改失败，请稍后重试"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                              }}
                              className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm"
                            >
                              更新密码
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">数据管理</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={async () => {
                            const data = { settings, export_time: new Date().toISOString(), version: "1.0.0" };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a"); a.href = url; a.download = `backup-${Date.now()}.json`; a.click();
                            URL.revokeObjectURL(url);
                            setToastType("success"); setToastMessage("Settings exported"); setShowToast(true); setTimeout(() => setShowToast(false), 3000);
                          }}
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm text-center"
                        >
                          导出设置 (JSON)
                        </button>
                        <button
                          onClick={() => {
                            const input = document.createElement("input"); input.type = "file"; input.accept = "application/json";
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                try {
                                  const text = await file.text(); const data = JSON.parse(text);
                                  if (data.settings) { setSettings(data.settings); setToastType("info"); setToastMessage("数据已导入，请点击保存"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                                  else { setToastType("error"); setToastMessage("无效的备份文件"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                                } catch (error) { setToastType("error"); setToastMessage("文件解析失败"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                              }
                            };
                            input.click();
                          }}
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm text-center"
                        >
                          导入设置
                        </button>
                      </div>
                    </div>
                    <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
                      <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-2">危险操作</h3>
                      <p className="text-xs text-red-600 mb-4">清除缓存后，所有静态资源将重新从源站获取。</p>
                      <button
                        onClick={async () => {
                          if (!confirm("确定要清除全站CDN缓存吗？")) return;
                          try {
                            const response = await fetch("/api/admin/purge-cache", { method: "POST" });
                            const result = await response.json() as { success: boolean, message?: string, error?: string };
                            if (result.success) { setToastType("success"); setToastMessage(result.message || "CDN缓存已清除"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                            else { setToastType("error"); setToastMessage(result.error || "清除缓存失败"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                          } catch (error) { setToastType("error"); setToastMessage("清除缓存失败"); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors text-sm"
                      >
                        强制刷新 CDN 缓存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              {activeTab === "about" && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">系统信息</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-sm font-semibold text-white/50 mb-1">版本</div>
                      <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">MAGI v1.2.0</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-sm font-semibold text-white/50 mb-1">架构</div>
                      <div className="text-lg font-bold text-white font-mono mt-1">React 19 / Remix / Cloudflare Workers</div>
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-4">技术栈</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Remix v2", "React v19", "Cloudflare D1", "Cloudflare R2", "Tailwind CSS", "Framer Motion", "TypeScript"].map((tech) => (
                        <span key={tech} className="px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-indigo-700 border border-indigo-200 shadow-sm">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-indigo-500/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-6"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-700">有未保存的修改</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">重置</button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
                {isSaving ? (<><RefreshCw size={14} className="animate-spin" /><span>保存中...</span></>) : (<><Save size={14} /><span>保存</span></>)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className={`fixed top-6 right-6 z-[200] rounded-2xl shadow-xl p-4 border backdrop-blur-xl ${toastType === "success" ? "bg-emerald-50/90 text-emerald-800 border-emerald-200/60" : toastType === "error" ? "bg-red-50/90 text-red-800 border-red-200/60" : toastType === "warning" ? "bg-amber-50/90 text-amber-800 border-amber-200/60" : "bg-blue-50/90 text-blue-800 border-blue-200/60"}`}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center gap-3 pr-4">
              <span className="text-lg">{toastType === "success" ? "✓" : toastType === "error" ? "✕" : toastType === "warning" ? "⚠" : "ℹ"}</span>
              <span className="font-medium text-sm">{toastMessage}</span>
              <button onClick={() => setShowToast(false)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
