import { useState } from "react";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit, redirect } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Lock, Bell, Palette, Shield, Database,
    Save, Loader2, Moon, Sun, Type, Volume2, Gamepad2,
    LayoutTemplate, CheckCircle, AlertCircle, Github, Twitter, MonitorPlay,
    Smartphone, History, Download, Trash2, ChevronRight
} from "lucide-react";
import { GameDashboardLayout } from "~/components/dashboard/game/GameDashboardLayout";
import { StatusHUD } from "~/components/dashboard/game/StatusHUD";
import { NavMenu } from "~/components/dashboard/game/NavMenu";
import { ClientOnly } from "~/components/common/ClientOnly";
import { ColorPicker } from "~/components/ui/ColorPicker";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { verifySession, updateUserProfile, changePassword, updateUserPreferences, getSessionToken, type User as AuthUser } from "~/services/auth.server";
import { getUserCoins } from "~/services/membership/coins.server";

// Define Route types manually
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

        const coins = await getUserCoins(db, result.user.id);

        return {
            user: {
                ...result.user,
                avatar_url: result.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.username}`
            },
            stats: {
                coins,
                level: result.user.level || 1,
                exp: result.user.exp || 0,
                maxExp: (result.user.level || 1) * 100,
            }
        };
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
            let preferences;
            try {
                preferences = JSON.parse(formData.get("preferences") as string);
            } catch (e) {
                return { success: false, message: "偏好设置数据格式错误" };
            }
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
    const { user, stats } = useLoaderData() as { user: AuthUser, stats: any };
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

    const tabs = [
        { id: "profile", label: "个人资料", icon: User, color: "text-blue-500" },
        { id: "security", label: "账户安全", icon: Lock, color: "text-green-500" },
        { id: "notifications", label: "通知设置", icon: Bell, color: "text-yellow-500" },
        { id: "privacy", label: "隐私权限", icon: Shield, color: "text-purple-500" },
        { id: "personalization", label: "个性化", icon: Palette, color: "text-pink-500" },
        { id: "data", label: "数据管理", icon: Database, color: "text-red-500" },
    ];

    const userData = {
        avatar: user.avatar_url || undefined,
        uid: `UID-${user.id.toString().padStart(6, '0')}`,
        level: stats.level,
        name: user.username,
        exp: stats.exp,
        maxExp: stats.maxExp,
    };

    return (
        <>
            <ClientOnly>
                {() => <StatusHUD user={userData} stats={{ coins: stats.coins }} />}
            </ClientOnly>
            <NavMenu />

            <div className="w-full max-w-[1400px] mx-auto pt-[calc(env(safe-area-inset-top)+5rem)] md:pt-32 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-32 px-4 md:pl-[120px] md:pr-8 flex flex-col min-h-screen">
                <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-8 flex-1">

                    {/* Sidebar / Topbar on Mobile */}
                    <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0 custom-scrollbar pb-2 md:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden whitespace-nowrap shrink-0
                                    ${activeTab === tab.id
                                        ? "bg-white text-slate-900 shadow-[0_4px_20px_rgb(255,255,255,0.15)]"
                                        : "text-white/60 hover:text-white hover:bg-white/10"
                                    }
                                `}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? "text-slate-900" : tab.color} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-8 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Feedback Message */}
                                {actionData?.message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${actionData.success
                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                                            }`}>
                                        {actionData.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {actionData.message}
                                    </motion.div>
                                )}

                                {activeTab === "profile" && (
                                    <Form method="post" className="space-y-8" encType="multipart/form-data">
                                        <input type="hidden" name="intent" value="update_profile" />

                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-black/40">
                                                {avatarPreview ? (
                                                    <OptimizedImage src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" width={100} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20"><User size={40} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold text-white cursor-pointer transition-colors inline-block">
                                                    更换头像
                                                    <input type="file" name="avatar_file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                                </label>
                                                <p className="text-white/40 text-xs mt-2">支持 JPG, PNG, GIF</p>
                                            </div>
                                            <input type="hidden" name="avatar_url" value={avatarPreview || ""} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-white/80">用户名</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    defaultValue={user.username}
                                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-white/40 outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-white/80">个人简介</label>
                                                <input
                                                    name="bio"
                                                    defaultValue={(user as any).bio || ""}
                                                    placeholder="写点什么..."
                                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-white/40 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-bold text-white">社交链接</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white/60 flex items-center gap-1"><Github size={12} /> GitHub</label>
                                                    <input
                                                        type="text"
                                                        value={preferences.social?.github || ""}
                                                        onChange={(e) => setPreferences({ ...preferences, social: { ...preferences.social, github: e.target.value } })}
                                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:border-white/40 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white/60 flex items-center gap-1"><Twitter size={12} /> Twitter</label>
                                                    <input
                                                        type="text"
                                                        value={preferences.social?.twitter || ""}
                                                        onChange={(e) => setPreferences({ ...preferences, social: { ...preferences.social, twitter: e.target.value } })}
                                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:border-white/40 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-white/60 flex items-center gap-1"><MonitorPlay size={12} /> Bilibili</label>
                                                    <input
                                                        type="text"
                                                        value={preferences.social?.bilibili || ""}
                                                        onChange={(e) => setPreferences({ ...preferences, social: { ...preferences.social, bilibili: e.target.value } })}
                                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:border-white/40 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <SaveButton onClick={() => savePreferences()} isSubmitting={isSubmitting} label="保存所有更改" />
                                        </div>
                                    </Form>
                                )}

                                {activeTab === "security" && (
                                    <div className="space-y-8">
                                        <Form method="post" className="space-y-6">
                                            <input type="hidden" name="intent" value="change_password" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-white/80">当前密码</label>
                                                    <input type="password" name="current_password" required className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-white/40 outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-white/80">新密码</label>
                                                    <input type="password" name="new_password" required className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-white/40 outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-white/80">确认新密码</label>
                                                    <input type="password" name="confirm_password" required className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-white/40 outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors disabled:opacity-50 text-sm border border-white/10">
                                                    更新密码
                                                </button>
                                            </div>
                                        </Form>

                                        <div className="pt-6 border-t border-white/10 space-y-4">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <History size={20} className="text-orange-500" />
                                                登录历史
                                            </h3>
                                            <div className="overflow-hidden rounded-xl border border-white/10">
                                                <table className="w-full text-sm text-left text-white/80">
                                                    <thead className="bg-white/5 text-white/60">
                                                        <tr>
                                                            <th className="px-4 py-3 font-medium">设备</th>
                                                            <th className="px-4 py-3 font-medium">位置</th>
                                                            <th className="px-4 py-3 font-medium">时间</th>
                                                            <th className="px-4 py-3 font-medium">状态</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        <tr className="bg-white/5">
                                                            <td className="px-4 py-3 flex items-center gap-2">
                                                                <Smartphone size={14} className="text-white/40" />
                                                                Chrome / Windows
                                                            </td>
                                                            <td className="px-4 py-3 text-white/60">Shanghai, CN</td>
                                                            <td className="px-4 py-3 text-white/60">刚刚</td>
                                                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">当前</span></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div className="space-y-6">
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
                                        <div className="flex justify-end pt-4">
                                            <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "privacy" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                            <div>
                                                <div className="font-bold text-white">个人主页可见性</div>
                                                <div className="text-xs text-white/50">谁可以查看你的个人主页</div>
                                            </div>
                                            <select
                                                value={preferences.privacy.profile_visibility}
                                                onChange={(e) => setPreferences({ ...preferences, privacy: { ...preferences.privacy, profile_visibility: e.target.value } })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
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
                                        <div className="flex justify-end pt-4">
                                            <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "personalization" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                            <div>
                                                <div className="font-bold text-white">主题色</div>
                                                <div className="text-xs text-white/50">选择你的主要强调色</div>
                                            </div>
                                            <ColorPicker
                                                colors={["#3b82f6", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]}
                                                selectedColor={preferences.personalization.theme_color || "#3b82f6"}
                                                onChange={(color) => setPreferences({ ...preferences, personalization: { ...preferences.personalization, theme_color: color } })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-white/10 text-white">
                                                    {preferences.personalization.code_theme === 'github-dark' ? <Moon size={18} /> : <Sun size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">深色模式</div>
                                                    <div className="text-xs text-white/50">切换全站明暗主题</div>
                                                </div>
                                            </div>
                                            <ThemeToggle />
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
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <SaveButton onClick={savePreferences} isSubmitting={isSubmitting} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "data" && (
                                    <div className="space-y-4">
                                        <button
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-white/5 transition-colors group text-left border border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                                    <Download size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">导出个人数据</div>
                                                    <div className="text-xs text-white/50">下载包含你所有活动记录的 JSON 文件</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors group text-left border border-red-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                                                    <Trash2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-red-400">清除本地缓存</div>
                                                    <div className="text-xs text-red-400/70">重置游戏化数据的本地缓存</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
}

function ToggleItem({ label, desc, checked, onChange, icon }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void, icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 rounded-lg bg-white/10 text-white/80">
                        {icon}
                    </div>
                )}
                <div>
                    <div className="font-bold text-white">{label}</div>
                    <div className="text-xs text-white/50">{desc}</div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-white/20"}`}
            >
                <motion.div
                    className="absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm bg-white"
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}

function SaveButton({ onClick, isSubmitting, label = "保存设置" }: { onClick: () => void, isSubmitting: boolean, label?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-white text-slate-900 rounded-xl font-bold shadow-lg shadow-white/10 hover:bg-slate-200 transition-all disabled:opacity-50"
        >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {label}
        </button>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-2xl max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-red-500">系统错误</h1>
                <p className="text-white/80 mb-4">无法加载设置页面。</p>
                <div className="bg-black/50 p-4 rounded text-left text-xs font-mono text-red-300 overflow-auto max-h-32 mb-6">
                    {error instanceof Error ? error.message : "Unknown Error"}
                </div>
                <a href="/user/dashboard" className="px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors">
                    返回指挥中心
                </a>
            </div>
        </div>
    );
}
