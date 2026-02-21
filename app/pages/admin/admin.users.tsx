import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import type { Route } from "./+types/admin.users";
import { useFetcher, redirect } from "react-router";
import { getSessionId } from "~/utils/auth";
import { Search, Shield, User, Mail, Calendar, MoreVertical, ShieldAlert, CheckCircle2, UserCheck, UserX, Plus, Key, X as CloseIcon } from "lucide-react";
import { hashPassword } from "~/services/crypto.server";

export async function loader({ request, context }: Route.LoaderArgs) {
    const sessionId = getSessionId(request);
    if (!sessionId) throw redirect("/admin/login");

    const { anime_db } = (context as any).cloudflare.env;

    try {
        const { results } = await anime_db.prepare(
            "SELECT id, username, email, avatar_url, role, level, created_at FROM users ORDER BY created_at DESC"
        ).all();

        const users = (results || []).map((user: any) => ({
            ...user,
            createdAt: new Date(user.created_at * 1000).toLocaleDateString(),
        }));

        // 获取并生成 CSRF Token
        const env = (context as any).cloudflare.env;
        const { generateCSRFToken } = await import("~/services/security/csrf.server");
        const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";
        const csrfToken = await generateCSRFToken(sessionId, env.CACHE_KV, secret);

        return { users, csrfToken };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { users: [], csrfToken: "" };
    }
}

export async function action({ request, context }: Route.ActionArgs) {
    const { requireAdmin } = await import("~/utils/auth");
    const { anime_db } = (context as any).cloudflare.env;

    // 1. 强制管理员鉴权
    const session = await requireAdmin(request, anime_db);
    if (!session) throw redirect("/admin/login");

    const formData = await request.formData();

    // 2. CSRF 校验
    const env = (context as any).cloudflare.env;
    const { validateCSRFToken } = await import("~/services/security/csrf.server");
    const csrfToken = formData.get("_csrf") as string;
    const secret = env.CSRF_SECRET || env.PAYMENT_SECRET || "default-secret";

    const csrfResult = await validateCSRFToken(csrfToken, (session as any).sessionId, env.CACHE_KV, secret);
    if (!csrfResult.valid) {
        return { success: false, error: "CSRF 验证失败" };
    }

    const intent = formData.get("intent");
    const userId = formData.get("userId");

    if (intent === "toggleRole") {
        const currentRole = formData.get("currentRole");
        const newRole = currentRole === "admin" ? "user" : "admin";
        await anime_db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(newRole, userId).run();
        return { success: true, message: `用户角色已更新为 ${newRole}` };
    }

    if (intent === "toggleStatus") {
        const currentRole = formData.get("currentRole");
        const newRole = currentRole === "banned" ? "user" : "banned";
        await anime_db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(newRole, userId).run();
        return { success: true, message: currentRole === "banned" ? "用户已解禁" : "用户已被限制访问" };
    }

    if (intent === "addUser") {
        const email = formData.get("email") as string;
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const role = formData.get("role") as string;

        const passwordHash = await hashPassword(password);

        try {
            await anime_db.prepare(
                "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)"
            ).bind(email, username, passwordHash, role).run();
            return { success: true, message: `新旅行者 ${username} 已加入团队` };
        } catch (e: any) {
            return { success: false, message: e.message.includes("UNIQUE") ? "邮箱已被占用" : "创建失败" };
        }
    }

    if (intent === "resetPassword") {
        const newPassword = formData.get("newPassword") as string;
        if (!newPassword || newPassword.length < 6) {
            return { success: false, message: "密码至少需要6位" };
        }
        const passwordHash = await hashPassword(newPassword);
        await anime_db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId).run();
        return { success: true, message: "密码重置成功" };
    }

    return { success: false, message: "未知指令" };
}

export default function UsersManager({ loaderData }: Route.ComponentProps) {
    const { users } = loaderData;
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
    const fetcher = useFetcher();

    // 状态自动清理
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            setShowAddModal(false);
            setResetPasswordId(null);
        }
    }, [fetcher.state, fetcher.data]);

    const filteredUsers = useMemo(() => {
        return users.filter((u: any) => {
            const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const handleAction = (userId: number, intent: string, extra: any = {}) => {
        const formData = new FormData();
        formData.append("intent", intent);
        formData.append("userId", userId.toString());
        if (loaderData.csrfToken) {
            formData.append("_csrf", loaderData.csrfToken);
        }
        Object.entries(extra).forEach(([k, v]) => formData.append(k, v as string));
        fetcher.submit(formData, { method: "post" });
    };

    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight font-orbitron">用户管理</h1>
                        <p className="text-white/50 text-sm mt-1">监管等级制度与账号安全，当前注册玩家: {users.length}</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        <span>招募新旅行者</span>
                    </button>
                </div>

                {/* Modals and Forms */}
                <AnimatePresence>
                    {showAddModal && (
                        <Modal title="招募新旅行者" onClose={() => setShowAddModal(false)}>
                            <fetcher.Form method="post" className="space-y-4">
                                <input type="hidden" name="intent" value="addUser" />
                                {loaderData.csrfToken && <input type="hidden" name="_csrf" value={loaderData.csrfToken} />}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">邮箱地址</label>
                                    <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40" placeholder="user@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">玩家名号</label>
                                    <input name="username" type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40" placeholder="旅行者 A" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">初始密码</label>
                                    <input name="password" type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40" placeholder="******" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">角色定位</label>
                                    <select name="role" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40 appearance-none">
                                        <option value="user" className="bg-[#0f111a]">普通玩家</option>
                                        <option value="admin" className="bg-[#0f111a]">管理员</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold mt-4 hover:bg-violet-500 transition-colors">
                                    完成招募
                                </button>
                            </fetcher.Form>
                        </Modal>
                    )}

                    {resetPasswordId && (
                        <Modal title="重置核心密码" onClose={() => setResetPasswordId(null)}>
                            <fetcher.Form method="post" className="space-y-4">
                                <input type="hidden" name="intent" value="resetPassword" />
                                <input type="hidden" name="userId" value={resetPasswordId} />
                                {loaderData.csrfToken && <input type="hidden" name="_csrf" value={loaderData.csrfToken} />}
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/70 text-xs flex gap-3">
                                    <ShieldAlert size={16} className="shrink-0" />
                                    <span>该操作将直接通过管理引擎覆盖数据库中的密码哈希，请谨慎操作并告知用户。</span>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">新密码</label>
                                    <input name="newPassword" type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/40" placeholder="至少 6 位..." />
                                </div>
                                <button type="submit" className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold mt-4 hover:bg-amber-500 transition-colors">
                                    强制重置
                                </button>
                            </fetcher.Form>
                        </Modal>
                    )}
                </AnimatePresence>

                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="通过用户名或邮箱搜寻旅行者..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-1 rounded-2xl inline-flex border border-white/10 shrink-0">
                            {[
                                { key: "all", label: "全部" },
                                { key: "admin", label: "管理员" },
                                { key: "user", label: "玩家" },
                                { key: "banned", label: "禁言中" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setRoleFilter(tab.key)}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === tab.key
                                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                        : "text-white/40 hover:text-white/60"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card-deep tech-border rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">玩家资料</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">权限角色</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">等级 (Level)</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">加入时间</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                                            未发现匹配的旅行者踪迹...
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user: any, index: number) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-white/10 flex items-center justify-center text-white font-bold relative overflow-hidden group-hover:scale-105 transition-transform">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.username[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-sm">{user.username}</span>
                                                        <span className="text-xs text-white/30 font-mono">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.1)]' :
                                                    user.role === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                                                    <span className="text-sm font-mono text-white/60 font-medium">Lv. {user.level}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-white/30 font-mono">
                                                {user.createdAt}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(user.id, "toggleStatus", { currentRole: user.role })}
                                                        className={`p-2 rounded-xl border transition-all ${user.role === 'banned'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                            }`}
                                                        title={user.role === 'banned' ? "解除禁令" : "封禁账号"}
                                                    >
                                                        {user.role === 'banned' ? <UserCheck size={16} /> : <UserX size={16} />}
                                                    </button>

                                                    <button
                                                        onClick={() => setResetPasswordId(user.id)}
                                                        className="p-2 rounded-xl border bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white transition-all"
                                                        title="重置密码"
                                                    >
                                                        <Key size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(user.id, "toggleRole", { currentRole: user.role })}
                                                        className={`p-2 rounded-xl border transition-all ${user.role === 'admin'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                            : 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20'
                                                            }`}
                                                        title={user.role === 'admin' ? "降级为玩家" : "提拔为管理"}
                                                    >
                                                        <Shield size={16} />
                                                    </button>

                                                    <button className="p-2 text-white/20 hover:text-white transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#0f111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-bold text-white font-orbitron text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors">
                        <CloseIcon size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
