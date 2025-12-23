import { useState, useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Lock, Bell, Palette, Shield, Database,
    Save, Loader2, Camera, ChevronRight, Moon, Sun,
    Type, Volume2, Gamepad2, Eye, EyeOff, Download, Trash2,
    Github, Twitter, Globe, History, Smartphone, LogOut, MonitorPlay, LayoutTemplate
} from "lucide-react";
import { ColorPicker } from "~/components/ui/ColorPicker";
import { verifySession, updateUserProfile, changePassword, updateUserPreferences, getSessionToken, type User as AuthUser } from "~/services/auth.server";
import { redirect } from "react-router";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
// Define Route types manually since +types/settings doesn't exist
namespace Route {
    export interface LoaderArgs {
        request: Request;
        context: any;
        params: any;
    }
    export interface ActionArgs {
        request: Request;
        context: any;
        params: any;
    }
}

// Loader: 获取用户信息
export async function loader({ request, context }: Route.LoaderArgs) {
    try {
        const env = (context as any).cloudflare.env;
        const db = env.anime_db;
        const token = getSessionToken(request);

        if (!token) {
            return redirect("/login");
        }

        const result = await verifySession(token, db);

        if (!result.valid || !result.user) {
            return redirect("/login");
        }
        return { user: result.user };
    } catch (error) {
        console.error("Settings Loader Error:", error);
        return redirect("/login");
    }
}

// Action: 处理表单提交
export async function action({ request, context }: Route.ActionArgs) {
    const env = (context as any).cloudflare.env;
    const db = env.anime_db;
    const token = getSessionToken(request);
    const result = await verifySession(token, db);

    if (!result.valid || !result.user) {
        return redirect("/login");
    }

    const user = result.user;
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "update_profile") {
            const username = formData.get("username") as string;
            const avatar_url = formData.get("avatar_url") as string;
            const bio = formData.get("bio") as string;

            await updateUserProfile(user.id, { username, avatar_url, bio }, db);
            return { success: true, message: "个人资料已更新" };
        }

        if (intent === "change_password") {
            const currentPassword = formData.get("current_password") as string;
            const newPassword = formData.get("new_password") as string;
            const confirmPassword = formData.get("confirm_password") as string;

            if (newPassword !== confirmPassword) {
                return { success: false, message: "新密码与确认密码不一致" };
            }

            const result = await changePassword(user.id, currentPassword, newPassword, db);
            if (!result.success) {
                return { success: false, message: result.error || "密码修改失败" };
            }
            return { success: true, message: "密码已修改" };
        }

        if (intent === "update_preferences") {
            const preferences = JSON.parse(formData.get("preferences") as string);
            await updateUserPreferences(user.id, preferences, db);
            return { success: true, message: "偏好设置已保存" };
        }

    } catch (error) {
        console.error("Settings Action Error:", error);
        return { success: false, message: "操作失败，请重试" };
    }

    return null;
}

export default function SettingsPage() {
    const { user } = useLoaderData() as { user: AuthUser };
    const actionData = useActionData();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting = navigation.state === "submitting";

    const [activeTab, setActiveTab] = useState("profile");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);

    // 默认偏好设置
    const defaultPreferences = {
        notifications: {
            email_reply: true,
            web_reply: true,
            article_update: true,
            system_msg: true
        },
        privacy: {
            profile_visibility: "public",
            show_game_stats: true,
            show_online_status: true
        },
        personalization: {
            code_theme: "github-dark",
            font_size: "medium",
            gacha_animation: true,
            sound_effects: true,
            theme_color: "#3b82f6",
            card_style: "glass"
        },
        social: {
            github: "",
            twitter: "",
            bilibili: ""
        }
    };

    // 合并用户偏好设置
    const [preferences, setPreferences] = useState(() => {
        try {
            const userPrefs = typeof user.preferences === 'string'
                ? JSON.parse(user.preferences)
                : user.preferences || {};
            return {
                notifications: { ...defaultPreferences.notifications, ...userPrefs.notifications },
                privacy: { ...defaultPreferences.privacy, ...userPrefs.privacy },
                personalization: { ...defaultPreferences.personalization, ...userPrefs.personalization },
                social: { ...defaultPreferences.social, ...userPrefs.social }
            };
        } catch (e) {
            return defaultPreferences;
        }
    });

    // 处理头像预览
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 保存偏好设置
    const savePreferences = () => {
        const formData = new FormData();
        formData.append("intent", "update_preferences");
        formData.append("preferences", JSON.stringify(preferences));
        submit(formData, { method: "post" });
    };

    // 导出数据
    const handleExportData = () => {
        const data = {
            user: { ...user, preferences },
            export_date: new Date().toISOString(),
            version: "1.0"
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user_data_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const tabs = [
        { id: "profile", label: "个人资料", icon: User, color: "text-blue-500" },
        { id: "security", label: "账户安全", icon: Lock, color: "text-green-500" },
        { id: "notifications", label: "通知设置", icon: Bell, color: "text-yellow-500" },
        { id: "privacy", label: "隐私权限", icon: Shield, color: "text-purple-500" },
        { id: "personalization", label: "个性化", icon: Palette, color: "text-pink-500" },
        { id: "data", label: "数据管理", icon: Database, color: "text-red-500" },
    ];

    const themeColors = [
        "#3b82f6", // Blue
        "#ec4899", // Pink
        "#8b5cf6", // Violet
        "#10b981", // Emerald
        "#f59e0b", // Amber
        "#ef4444", // Red
    ];

    return (
        <div className="min-h-screen pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-primary-start/10 to-primary-end/10 border border-white/20 dark:border-slate-700/30">
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl"
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl">
                                👤
                            </div>
                        )}
                    </motion.div>
                    <div className="text-center md:text-left">
                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white font-display mb-2"
                        >
                            {user.username}
                        </motion.h1>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-600 dark:text-slate-400 max-w-lg"
                        >
                            {user.bio || "这个人很懒，什么都没有写..."}
                        </motion.p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="glass-card rounded-2xl p-3 space-y-1 sticky top-24">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${activeTab === tab.id
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? "bg-white dark:bg-slate-700 shadow-sm" : "bg-transparent"} transition-all`}>
                                    <tab.icon size={18} className={tab.color} />
                                </div>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div 
                                        layoutId="active-indicator" 
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary-start rounded-l-xl"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="glass-card rounded-2xl p-6 md:p-8 min-h-[500px]"
                        >
                            {/* Feedback Message */}
                            {actionData?.message && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${actionData.success
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                                    }`}>
                                    {actionData.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {actionData.message}
                                </motion.div>
                            )}

                            {/* Profile Settings */}
                            {activeTab === "profile" && (
                                <Form method="post" className="space-y-8" encType="multipart/form-data">
                                    <input type="hidden" name="intent" value="update_profile" />
                                    
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <User size={20} className="text-blue-500" />
                                            基本信息
                                        </h2>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">头像</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                        {avatarPreview ? (
                                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                                        )}
                                                    </div>
                                                    <label className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                        更换头像
                                                        <input type="file" name="avatar_file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                                    </label>
                                                </div>
                                                <input type="hidden" name="avatar_url" value={avatarPreview || ""} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    defaultValue={user.username}
                                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-start outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">个人简介</label>
                                            <textarea
                                                name="bio"
                                                rows={3}
                                                defaultValue={user.bio || ""}
                                                placeholder="写点什么来介绍你自己..."
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-start outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-6">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Globe size={20} className="text-indigo-500" />
                                            社交链接
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Github size={12}/> GitHub</label>
                                                <input
                                                    type="text"
                                                    value={preferences.social?.github || ""}
                                                    onChange={(e) => setPreferences({...preferences, social: {...preferences.social, github: e.target.value}})}
                                                    placeholder="username"
                                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-start outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Twitter size={12}/> Twitter</label>
                                                <input
                                                    type="text"
                                                    value={preferences.social?.twitter || ""}
                                                    onChange={(e) => setPreferences({...preferences, social: {...preferences.social, twitter: e.target.value}})}
                                                    placeholder="username"
                                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-start outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><MonitorPlay size={12}/> Bilibili</label>
                                                <input
                                                    type="text"
                                                    value={preferences.social?.bilibili || ""}
                                                    onChange={(e) => setPreferences({...preferences, social: {...preferences.social, bilibili: e.target.value}})}
                                                    placeholder="uid"
                                                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-start outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <SaveButton onClick={() => {
                                            // For profile tab, we submit the form naturally, but we also need to save preferences (social links)
                                            // This is tricky because we have two different save actions.
                                            // Let's just save preferences silently when clicking save, or combine them.
                                            // For now, let's use a separate hidden input for preferences in this form?
                                            // Or just trigger savePreferences() as well.
                                            savePreferences();
                                        }} isSubmitting={isSubmitting} label="保存所有更改" />
                                    </div>
                                </Form>
                            )}

                            {/* Security Settings */}
                            {activeTab === "security" && (
                                <div className="space-y-8">
                                    <Form method="post" className="space-y-6">
                                        <input type="hidden" name="intent" value="change_password" />
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Lock size={20} className="text-green-500" />
                                            修改密码
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">当前密码</label>
                                                <input type="password" name="current_password" required className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-start outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">新密码</label>
                                                <input type="password" name="new_password" required className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-start outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">确认新密码</label>
                                                <input type="password" name="confirm_password" required className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-start outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm">
                                                更新密码
                                            </button>
                                        </div>
                                    </Form>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <History size={20} className="text-orange-500" />
                                            登录历史
                                        </h2>
                                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">设备</th>
                                                        <th className="px-4 py-3 font-medium">位置</th>
                                                        <th className="px-4 py-3 font-medium">时间</th>
                                                        <th className="px-4 py-3 font-medium">状态</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                    <tr className="bg-white dark:bg-slate-900/20">
                                                        <td className="px-4 py-3 flex items-center gap-2">
                                                            <Smartphone size={14} className="text-slate-400" />
                                                            Chrome / Windows
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500">Shanghai, CN</td>
                                                        <td className="px-4 py-3 text-slate-500">刚刚</td>
                                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">当前</span></td>
                                                    </tr>
                                                    <tr className="bg-slate-50/50 dark:bg-slate-900/10">
                                                        <td className="px-4 py-3 flex items-center gap-2">
                                                            <Smartphone size={14} className="text-slate-400" />
                                                            Safari / iPhone
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500">Shanghai, CN</td>
                                                        <td className="px-4 py-3 text-slate-500">2小时前</td>
                                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">成功</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Settings */}
                            {activeTab === "notifications" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Bell size={20} className="text-yellow-500" />
                                        通知偏好
                                    </h2>
                                    <div className="space-y-4">
                                        <ToggleItem
                                            label="邮件回复通知"
                                            desc="当有人回复你的评论时发送邮件"
                                            checked={preferences.notifications.email_reply}
                                            onChange={(v) => setPreferences({ ...preferences, notifications: { ...preferences.notifications, email_reply: v } })}
                                        />
                                        <ToggleItem
                                            label="站内回复通知"
                                            desc="当有人回复你的评论时发送站内信"
                                            checked={preferences.notifications.web_reply}
                                            onChange={(v) => setPreferences({ ...preferences, notifications: { ...preferences.notifications, web_reply: v } })}
                                        />
                                        <ToggleItem
                                            label="文章更新提醒"
                                            desc="关注的番剧或文章更新时通知"
                                            checked={preferences.notifications.article_update}
                                            onChange={(v) => setPreferences({ ...preferences, notifications: { ...preferences.notifications, article_update: v } })}
                                        />
                                        <ToggleItem
                                            label="系统消息"
                                            desc="游戏化活动、成就解锁等系统通知"
                                            checked={preferences.notifications.system_msg}
                                            onChange={(v) => setPreferences({ ...preferences, notifications: { ...preferences.notifications, system_msg: v } })}
                                        />
                                    </div>
                                    <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                </div>
                            )}

                            {/* Privacy Settings */}
                            {activeTab === "privacy" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Shield size={20} className="text-purple-500" />
                                        隐私与权限
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <div className="font-medium text-slate-800 dark:text-white">个人主页可见性</div>
                                                <div className="text-xs text-slate-500">谁可以查看你的个人主页</div>
                                            </div>
                                            <select
                                                value={preferences.privacy.profile_visibility}
                                                onChange={(e) => setPreferences({ ...preferences, privacy: { ...preferences.privacy, profile_visibility: e.target.value } })}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-start"
                                            >
                                                <option value="public">公开</option>
                                                <option value="user_only">仅登录用户</option>
                                                <option value="private">私密</option>
                                            </select>
                                        </div>
                                        <ToggleItem
                                            label="展示游戏数据"
                                            desc="在个人主页显示等级、背包和成就"
                                            checked={preferences.privacy.show_game_stats}
                                            onChange={(v) => setPreferences({ ...preferences, privacy: { ...preferences.privacy, show_game_stats: v } })}
                                        />
                                        <ToggleItem
                                            label="显示在线状态"
                                            desc="允许其他用户看到你是否在线"
                                            checked={preferences.privacy.show_online_status}
                                            onChange={(v) => setPreferences({ ...preferences, privacy: { ...preferences.privacy, show_online_status: v } })}
                                        />
                                    </div>
                                    <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                </div>
                            )}

                            {/* Personalization Settings */}
                            {activeTab === "personalization" && (
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Palette size={20} className="text-pink-500" />
                                            外观定制
                                        </h2>
                                        
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">主题色</div>
                                                    <div className="text-xs text-slate-500">选择你的主要强调色</div>
                                                </div>
                                                <ColorPicker 
                                                    colors={themeColors} 
                                                    selectedColor={preferences.personalization.theme_color || "#3b82f6"}
                                                    onChange={(color) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, theme_color: color } })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    {preferences.personalization.code_theme === 'github-dark' ? <Moon size={18} /> : <Sun size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">深色模式</div>
                                                    <div className="text-xs text-slate-500">切换全站明暗主题</div>
                                                </div>
                                            </div>
                                            <ThemeToggle />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                    <Type size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">字体大小</div>
                                                    <div className="text-xs text-slate-500">文章阅读字体大小</div>
                                                </div>
                                            </div>
                                            <select
                                                value={preferences.personalization.font_size}
                                                onChange={(e) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, font_size: e.target.value } })}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-start"
                                            >
                                                <option value="small">小</option>
                                                <option value="medium">中</option>
                                                <option value="large">大</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ToggleItem
                                                label="扭蛋机动画"
                                                desc="开启后显示华丽的抽卡动画"
                                                icon={<Gamepad2 size={18} />}
                                                checked={preferences.personalization.gacha_animation}
                                                onChange={(v) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, gacha_animation: v } })}
                                            />
                                            <ToggleItem
                                                label="背景音效"
                                                desc="开启网站互动音效"
                                                icon={<Volume2 size={18} />}
                                                checked={preferences.personalization.sound_effects}
                                                onChange={(v) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, sound_effects: v } })}
                                            />
                                            <ToggleItem
                                                label="卡片风格"
                                                desc="使用毛玻璃特效"
                                                icon={<LayoutTemplate size={18} />}
                                                checked={preferences.personalization.card_style === 'glass'}
                                                onChange={(v) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, card_style: v ? 'glass' : 'solid' } })}
                                            />
                                        </div>
                                    </div>
                                    <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                </div>
                            )}

                            {/* Data Management */}
                            {activeTab === "data" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Database size={20} className="text-red-500" />
                                        数据管理
                                    </h2>
                                    <div className="space-y-4">
                                        <button 
                                            onClick={handleExportData}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group text-left border border-slate-100 dark:border-slate-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                    <Download size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-white">导出个人数据</div>
                                                    <div className="text-xs text-slate-500">下载包含你所有活动记录的 JSON 文件</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group text-left border border-red-100 dark:border-red-900/30">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                    <Trash2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-red-700 dark:text-red-400">清除本地缓存</div>
                                                    <div className="text-xs text-red-500/70">重置游戏化数据的本地缓存（不会删除云端数据）</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        
                                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 text-xs text-orange-600 dark:text-orange-400">
                                            <strong>注意：</strong> 账户注销功能暂未开放，如需注销请联系管理员。
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Helper Components


// Helper Components
function ToggleItem({ label, desc, checked, onChange, icon }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void, icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {icon}
                    </div>
                )}
                <div>
                    <div className="font-medium text-slate-800 dark:text-white">{label}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary-start" : "bg-slate-300 dark:bg-slate-600"
                    }`}
            >
                <motion.div
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}

function SaveButton({ onClick, isSubmitting, label = "保存设置" }: { onClick: () => void, isSubmitting: boolean, label?: string }) {
    return (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
            <button
                type="button"
                onClick={onClick}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary-start hover:bg-primary-end text-white rounded-xl font-medium shadow-lg shadow-primary-start/30 transition-all disabled:opacity-50"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {label}
            </button>
        </div>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center space-y-4 border border-red-200 dark:border-red-900/30">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-display">
                    设置页面遇到问题
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    抱歉，加载设置时发生了错误。这可能是由于数据同步问题引起的。
                </p>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-xs font-mono text-left overflow-auto max-h-32 text-slate-500">
                    {error instanceof Error ? error.message : "Unknown Error"}
                </div>
                <div className="flex gap-3 justify-center pt-2">
                    <a
                        href="/"
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        返回首页
                    </a>
                    <a
                        href="/settings"
                        className="px-4 py-2 rounded-xl bg-primary-start text-white font-medium hover:bg-primary-end transition-colors shadow-lg shadow-primary-start/20"
                    >
                        重试
                    </a>
                </div>
            </div>
        </div>
    );
}
