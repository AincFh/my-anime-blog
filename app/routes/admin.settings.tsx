import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Route } from "./+types/admin.settings";
import { redirect } from "react-router";
import { requireAdmin } from "~/utils/auth";
import type { SystemSettings } from "~/contexts/SettingsContext";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { getDB } = await import("~/utils/db");
  const db = getDB(context);

  // 验证管理员权限
  const session = await requireAdmin(request, db);
  if (!session) {
    throw redirect("/admin/login");
  }

  try {
    // 从数据库读取配置JSON
    const result = await db
      .prepare("SELECT config_json FROM system_config WHERE id = 1")
      .first<{ config_json: string }>();

    if (result && result.config_json) {
      return { settings: JSON.parse(result.config_json) };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  // 返回默认配置
  return { settings: null };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { getDB } = await import("~/utils/db");
  const db = getDB(context);

  // 验证管理员权限
  const session = await requireAdmin(request, db);
  if (!session) {
    throw redirect("/admin/login");
  }

  const formData = await request.formData();
  const configJson = formData.get("config_json") as string;

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

    return { success: true, message: "系统配置已重载，世界线变动成功" };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { success: false, error: "保存失败" };
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
    primary_color: "#FF9F43",
    radius: "large",
    enable_particles: true,
    enable_blur: true,
    gray_mode: false,
  },
  features: {
    live2d: {
      enabled: true,
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
};

type SettingsTab = "basic" | "theme" | "features" | "integrations" | "security" | "about";

export default function Settings({ loaderData, actionData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("basic");
  const [settings, setSettings] = useState<SystemSettings>(
    loaderData.settings || defaultSettings
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info" | "warning">("success");
  const [isSaving, setIsSaving] = useState(false);

  // 检测是否有未保存的修改
  useEffect(() => {
    const originalSettings = loaderData.settings || defaultSettings;
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, loaderData.settings]);

  // 显示actionData的消息
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setToastType("success");
        setToastMessage(actionData.message || "保存成功");
      } else {
        setToastType("error");
        setToastMessage(actionData.error || "保存失败");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [actionData]);

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("config_json", JSON.stringify(settings));

    try {
      const response = await fetch("/admin/settings", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setHasChanges(false);
        setToastType("success");
        setToastMessage(result.message || "保存成功");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // 重新加载页面以应用新设置
        window.location.reload();
      } else {
        setToastType("error");
        setToastMessage(result.error || "保存失败");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      setToastType("error");
      setToastMessage("保存失败，请稍后重试");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("确定要重置所有修改吗？")) {
      setSettings(loaderData.settings || defaultSettings);
      setHasChanges(false);
    }
  };

  const tabs = [
    { key: "basic", label: "基本设定", icon: "🏠", description: "网站身份信息" },
    { key: "theme", label: "外观引擎", icon: "🎨", description: "视觉主题配置" },
    { key: "features", label: "功能模块", icon: "🧩", description: "功能开关与配置" },
    { key: "integrations", label: "第三方连接", icon: "🔌", description: "外部服务集成" },
    { key: "security", label: "安全与备份", icon: "🛡️", description: "系统安全与数据管理" },
    { key: "about", label: "关于系统", icon: "ℹ️", description: "版本信息与更新日志" },
  ];

  const ToggleSwitch = ({ enabled, onChange, label, description }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-1">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-14 h-8 rounded-full transition-all duration-300 ${enabled ? "bg-green-500" : "bg-gray-300"
            } group-hover:shadow-lg`}
        >
          <motion.div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md`}
            animate={{
              x: enabled ? 24 : 0,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
      <div className="flex-1">
        <span className="text-gray-700 font-medium block">{label}</span>
        {description && (
          <span className="text-gray-500 text-xs block mt-1">{description}</span>
        )}
      </div>
    </label>
  );

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">MAGI 系统设置</h1>
            <p className="text-gray-500 text-sm">控制整个网站的"生杀大权"和"感官体验"</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧垂直导航 - 优化设计 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2 sticky top-4">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as SettingsTab)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.key
                    ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 shadow-sm border border-pink-200"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-7">{tab.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 右侧内容区 - 优化设计 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {/* 基本设定 */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">基本设定</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      🏠 网站身份信息
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        网站标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.site_title}
                        onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                        placeholder="Project Blue Sky"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        站长昵称
                      </label>
                      <input
                        type="text"
                        value={settings.master_name}
                        onChange={(e) => setSettings({ ...settings, master_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                        placeholder="Master"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO 描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all resize-none"
                      placeholder="给搜索引擎看的网站描述..."
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {settings.site_description.length} / 160 字符
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      关键词
                    </label>
                    <input
                      type="text"
                      value={settings.keywords}
                      onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                      placeholder="二次元, React, 博客（用逗号分隔）"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">头像 URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={settings.avatar_url}
                          onChange={(e) => setSettings({ ...settings, avatar_url: e.target.value })}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          placeholder="https://..."
                        />
                        {settings.avatar_url && (
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                            <img src={settings.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">建站年份</label>
                      <input
                        type="number"
                        value={settings.start_year}
                        onChange={(e) => setSettings({ ...settings, start_year: parseInt(e.target.value) || 2024 })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">一句话简介</label>
                    <input
                      type="text"
                      value={settings.bio}
                      onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                      placeholder="欢迎来到我的二次元基地"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">页脚文字</label>
                      <input
                        type="text"
                        value={settings.footer_text}
                        onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                        placeholder="© 2024 Project Blue Sky"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ICP/备案号</label>
                      <input
                        type="text"
                        value={settings.icp_number || ""}
                        onChange={(e) => setSettings({ ...settings, icp_number: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                        placeholder="（可选）"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 外观引擎 */}
              {activeTab === "theme" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">外观引擎</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      🎨 视觉主题配置
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">默认背景图 URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={settings.theme.default_wallpaper}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, default_wallpaper: e.target.value }
                          })}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          placeholder="https://..."
                        />
                        {settings.theme.default_wallpaper && (
                          <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={settings.theme.default_wallpaper}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">深色模式背景图 URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={settings.theme.dark_mode_wallpaper}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, dark_mode_wallpaper: e.target.value }
                          })}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          placeholder="https://..."
                        />
                        {settings.theme.dark_mode_wallpaper && (
                          <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={settings.theme.dark_mode_wallpaper}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        遮罩透明度: <span className="text-pink-600 font-bold">{Math.round(settings.theme.overlay_opacity * 100)}%</span>
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
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>10%</span>
                          <span>50%</span>
                          <span>90%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">主色调</label>
                      <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { name: "橙色", value: "#FF9F43" },
                            { name: "粉色", value: "#EC4899" },
                            { name: "紫色", value: "#8B5CF6" },
                            { name: "绿色", value: "#10B981" },
                            { name: "蓝色", value: "#3B82F6" },
                          ].map((color) => (
                            <motion.button
                              key={color.value}
                              onClick={() => setSettings({
                                ...settings,
                                theme: { ...settings.theme, primary_color: color.value }
                              })}
                              className={`relative px-4 py-2 rounded-lg border-2 transition-all ${settings.theme.primary_color === color.value
                                ? "border-gray-800 scale-105 shadow-lg"
                                : "border-gray-300 hover:border-gray-400"
                                }`}
                              style={{ backgroundColor: color.value }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="text-white text-sm font-medium drop-shadow-md">
                                {color.name}
                              </span>
                              {settings.theme.primary_color === color.value && (
                                <motion.div
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <span className="text-green-500 text-xs">✓</span>
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.theme.primary_color}
                            onChange={(e) => setSettings({
                              ...settings,
                              theme: { ...settings.theme, primary_color: e.target.value }
                            })}
                            className="w-16 h-16 rounded-xl border-2 border-gray-300 cursor-pointer"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={settings.theme.primary_color}
                              onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                  setSettings({
                                    ...settings,
                                    theme: { ...settings.theme, primary_color: e.target.value }
                                  });
                                }
                              }}
                              placeholder="#FF9F43"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                            />
                            <div className="text-xs text-gray-500 mt-1">输入十六进制颜色值</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">圆角大小</label>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { value: "small", label: "Small", preview: "rounded" },
                          { value: "medium", label: "Medium", preview: "rounded-lg" },
                          { value: "large", label: "Large", preview: "rounded-xl" },
                          { value: "full", label: "Full", preview: "rounded-full" },
                        ].map((option) => (
                          <motion.button
                            key={option.value}
                            onClick={() => setSettings({
                              ...settings,
                              theme: { ...settings.theme, radius: option.value as any }
                            })}
                            className={`px-4 py-3 border-2 rounded-xl transition-all ${settings.theme.radius === option.value
                              ? "border-pink-500 bg-pink-50 text-pink-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={`w-full h-12 bg-gradient-to-r from-pink-200 to-purple-200 ${option.preview} mb-2`} />
                            <div className="text-sm font-medium">{option.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                      <ToggleSwitch
                        enabled={settings.theme.enable_particles}
                        onChange={(v) => setSettings({
                          ...settings,
                          theme: { ...settings.theme, enable_particles: v }
                        })}
                        label="开启粒子特效"
                        description="樱花/星光粒子效果（低配设备建议关闭）"
                      />
                      <ToggleSwitch
                        enabled={settings.theme.enable_blur}
                        onChange={(v) => setSettings({
                          ...settings,
                          theme: { ...settings.theme, enable_blur: v }
                        })}
                        label="开启毛玻璃效果"
                        description="backdrop-filter 模糊效果（移动端自动降级）"
                      />
                      <ToggleSwitch
                        enabled={settings.theme.gray_mode}
                        onChange={(v) => setSettings({
                          ...settings,
                          theme: { ...settings.theme, gray_mode: v }
                        })}
                        label="全站置灰模式"
                        description="特殊日子使用（如公祭日）"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 功能模块 */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">功能模块</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      🧩 功能开关与配置
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">模型 JSON 链接</label>
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
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
                          <select
                            value={settings.features.live2d.position}
                            onChange={(e) => setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                live2d: { ...settings.features.live2d, position: e.target.value as any }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                          >
                            <option value="bottom-left">左下</option>
                            <option value="bottom-right">右下</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">播放列表 ID</label>
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
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            默认音量: <span className="text-blue-600 font-bold">{settings.features.music.volume}%</span>
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
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

              {/* 第三方连接 */}
              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">第三方连接</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      🔌 外部服务集成
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📊</span>
                        <span>统计分析</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
                          <input
                            type="text"
                            value={settings.integrations.google_analytics_id || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                google_analytics_id: e.target.value
                              }
                            })}
                            placeholder="G-XXXXX"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          />
                          <div className="text-xs text-gray-500 mt-1">在 Google Analytics 中获取</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cloudflare Web Analytics Token</label>
                          <input
                            type="text"
                            value={settings.integrations.cloudflare_analytics_token || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                cloudflare_analytics_token: e.target.value
                              }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="在 Cloudflare Dashboard 中获取"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>🌐</span>
                        <span>社交媒体</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>🐙</span>
                            <span>GitHub</span>
                          </label>
                          <input
                            type="url"
                            value={settings.integrations.social.github || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                social: {
                                  ...settings.integrations.social,
                                  github: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>📺</span>
                            <span>Bilibili</span>
                          </label>
                          <input
                            type="url"
                            value={settings.integrations.social.bilibili || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                social: {
                                  ...settings.integrations.social,
                                  bilibili: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="https://space.bilibili.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>🐦</span>
                            <span>Twitter/X</span>
                          </label>
                          <input
                            type="url"
                            value={settings.integrations.social.twitter || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                social: {
                                  ...settings.integrations.social,
                                  twitter: e.target.value
                                }
                              }
                            })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>☁️</span>
                        <span>对象存储 (R2)</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">公开访问域名</label>
                          <input
                            type="text"
                            value={settings.integrations.r2.public_domain || ""}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                r2: {
                                  ...settings.integrations.r2,
                                  public_domain: e.target.value
                                }
                              }
                            })}
                            placeholder="img.aincfh.dpdns.org"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          />
                          <div className="text-xs text-gray-500 mt-1">R2 存储桶的公开访问域名</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">上传路径前缀</label>
                          <input
                            type="text"
                            value={settings.integrations.r2.upload_path}
                            onChange={(e) => setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                r2: {
                                  ...settings.integrations.r2,
                                  upload_path: e.target.value
                                }
                              }
                            })}
                            placeholder="uploads/"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          />
                          <div className="text-xs text-gray-500 mt-1">图片上传的默认文件夹</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 安全与备份 */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">安全与备份</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      🛡️ 系统安全与数据管理
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>🔒</span>
                        <span>访问控制</span>
                      </h3>
                      <div className="space-y-4">
                        <ToggleSwitch
                          enabled={settings.security.maintenance_mode}
                          onChange={(v) => setSettings({
                            ...settings,
                            security: { ...settings.security, maintenance_mode: v }
                          })}
                          label="维护模式"
                          description="开启后前台只显示施工中页面，其他人无法访问"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">修改后台密码</label>
                          <div className="space-y-3">
                            <input
                              type="password"
                              id="current-password"
                              placeholder="当前密码"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            />
                            <input
                              type="password"
                              id="new-password"
                              placeholder="新密码（至少8位）"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            />
                            <input
                              type="password"
                              id="confirm-password"
                              placeholder="确认新密码"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                            />
                            <motion.button
                              onClick={async () => {
                                const currentPassword = (document.getElementById("current-password") as HTMLInputElement)?.value;
                                const newPassword = (document.getElementById("new-password") as HTMLInputElement)?.value;
                                const confirmPassword = (document.getElementById("confirm-password") as HTMLInputElement)?.value;

                                if (!currentPassword || !newPassword || !confirmPassword) {
                                  setToastType("error");
                                  setToastMessage("请填写所有密码字段");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }

                                if (newPassword.length < 8) {
                                  setToastType("error");
                                  setToastMessage("新密码至少需要8位");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }

                                if (newPassword !== confirmPassword) {
                                  setToastType("error");
                                  setToastMessage("两次输入的密码不一致");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                  return;
                                }

                                try {
                                  const formData = new FormData();
                                  formData.append("current_password", currentPassword);
                                  formData.append("new_password", newPassword);
                                  formData.append("confirm_password", confirmPassword);

                                  const response = await fetch("/api/admin/change-password", {
                                    method: "POST",
                                    body: formData,
                                  });

                                  const result = await response.json();

                                  if (result.success) {
                                    setToastType("success");
                                    setToastMessage(result.message || "密码修改成功");
                                    setShowToast(true);
                                    setTimeout(() => {
                                      setShowToast(false);
                                      // 清空输入框
                                      (document.getElementById("current-password") as HTMLInputElement).value = "";
                                      (document.getElementById("new-password") as HTMLInputElement).value = "";
                                      (document.getElementById("confirm-password") as HTMLInputElement).value = "";
                                    }, 3000);
                                  } else {
                                    setToastType("error");
                                    setToastMessage(result.error || "密码修改失败");
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 3000);
                                  }
                                } catch (error) {
                                  setToastType("error");
                                  setToastMessage("密码修改失败，请稍后重试");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                }
                              }}
                              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              🔐 更新密码
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>💾</span>
                        <span>数据管理</span>
                      </h3>
                      <div className="space-y-4">
                        <motion.button
                          onClick={async () => {
                            // 导出数据
                            const data = {
                              settings,
                              export_time: new Date().toISOString(),
                              version: "1.0.0",
                            };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `backup-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);

                            setToastType("success");
                            setToastMessage("数据已导出");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          }}
                          className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>📥</span>
                          <span>导出全站数据</span>
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "application/json";
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                try {
                                  const text = await file.text();
                                  const data = JSON.parse(text);
                                  if (data.settings) {
                                    setSettings(data.settings);
                                    setToastType("info");
                                    setToastMessage("数据已导入，请点击保存");
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 3000);
                                  } else {
                                    setToastType("error");
                                    setToastMessage("无效的备份文件");
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 3000);
                                  }
                                } catch (error) {
                                  setToastType("error");
                                  setToastMessage("文件解析失败");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 3000);
                                }
                              }
                            };
                            input.click();
                          }}
                          className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>📤</span>
                          <span>从 JSON 恢复数据</span>
                        </motion.button>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>⚡</span>
                        <span>缓存控制</span>
                      </h3>
                      <motion.button
                        onClick={async () => {
                          if (!confirm("确定要清除全站CDN缓存吗？这可能会影响性能。")) {
                            return;
                          }

                          try {
                            const response = await fetch("/api/admin/purge-cache", {
                              method: "POST",
                            });
                            const result = await response.json();

                            if (result.success) {
                              setToastType("success");
                              setToastMessage(result.message || "CDN缓存已清除");
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            } else {
                              setToastType("error");
                              setToastMessage(result.error || "清除缓存失败");
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }
                          } catch (error) {
                            setToastType("error");
                            setToastMessage("清除缓存失败，请稍后重试");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          }
                        }}
                        className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>🔴</span>
                        <span>强制刷新 CDN 缓存</span>
                      </motion.button>
                      <div className="text-xs text-gray-500 mt-2">
                        清除后，所有静态资源将重新从源站获取
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 关于系统 */}
              {activeTab === "about" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">关于系统</h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      ℹ️ 版本信息与更新日志
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 系统信息卡片 */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>💻</span>
                        <span>系统信息</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">系统版本</div>
                          <div className="text-lg font-bold text-gray-800 font-mono">v1.0.0</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">React 版本</div>
                          <div className="text-lg font-bold text-gray-800 font-mono">v19.1.1</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">Cloudflare 区域</div>
                          <div className="text-lg font-bold text-gray-800 font-mono">NRT (Tokyo)</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">部署时间</div>
                          <div className="text-lg font-bold text-gray-800 font-mono">
                            {new Date().toLocaleDateString("zh-CN")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 更新日志 */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📝</span>
                        <span>更新日志</span>
                      </h3>
                      <div className="space-y-4">
                        <motion.div
                          className="bg-white rounded-xl p-4 border-l-4 border-pink-500 shadow-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-gray-800">v1.0.0</div>
                            <div className="text-xs text-gray-500">2024-01-15</div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>✨ 初始版本发布</div>
                            <div>🎨 实现Modern Digital风格UI</div>
                            <div>🛠️ 完成MAGI系统设置面板</div>
                            <div>🚀 集成Cloudflare生态系统</div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* 技术栈 */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>⚙️</span>
                        <span>技术栈</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {["React Router v7", "Cloudflare D1", "Cloudflare R2", "Tailwind CSS", "Framer Motion", "TypeScript"].map((tech) => (
                          <motion.span
                            key={tech}
                            className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200 shadow-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            {tech}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 未保存提示栏 */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-lg"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 bg-yellow-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-gray-700 font-medium">检测到未保存的修改</span>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    重置
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: isSaving ? 1 : 1.05 }}
                    whileTap={{ scale: isSaving ? 1 : 0.95 }}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>保存</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast 提示 - 优化设计 */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              className={`fixed top-20 right-8 z-[200] rounded-xl shadow-xl p-4 border min-w-[300px] ${toastType === "success"
                ? "bg-green-500 text-white border-green-600"
                : toastType === "error"
                  ? "bg-red-500 text-white border-red-600"
                  : toastType === "warning"
                    ? "bg-yellow-500 text-white border-yellow-600"
                    : "bg-blue-500 text-white border-blue-600"
                }`}
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20, x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {toastType === "success" ? "✓" : toastType === "error" ? "✕" : toastType === "warning" ? "⚠" : "ℹ"}
                </span>
                <span className="font-medium flex-1">{toastMessage}</span>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
