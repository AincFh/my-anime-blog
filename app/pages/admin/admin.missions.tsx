import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Form } from "react-router";
import { Trophy, Plus, Trash2, Edit3, Save, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "~/components/ui/Toast";
import { confirmModal } from "~/components/ui/Modal";

// --- Types ---
interface Mission {
    id: number;
    name: string;
    description: string;
    reward_coins: number;
    reward_exp: number;
    type: "daily" | "weekly" | "monthly" | "achievement";
    target_action: string;
    target_count: number;
    is_active: number;
}

// --- Loader ---
export async function loader({ request, context }: any) {
    const { anime_db } = context.cloudflare.env;
    const missions = await anime_db.prepare("SELECT * FROM missions ORDER BY type, id").all();
    return { missions: missions.results as Mission[] };
}

// --- Action ---
export async function action({ request, context }: any) {
    const { anime_db } = context.cloudflare.env;
    const formData = await request.formData();
    const action = formData.get("action");

    try {
        if (action === "update") {
            const id = formData.get("id");
            const name = formData.get("name");
            const description = formData.get("description");
            const reward_coins = parseInt(formData.get("reward_coins") as string);
            const reward_exp = parseInt(formData.get("reward_exp") as string);
            const type = formData.get("type");
            const target_action = formData.get("target_action");
            const target_count = parseInt(formData.get("target_count") as string);
            const is_active = formData.get("is_active") === "true" ? 1 : 0;

            await anime_db.prepare(`
                UPDATE missions SET 
                name = ?, description = ?, reward_coins = ?, reward_exp = ?, 
                type = ?, target_action = ?, target_count = ?, is_active = ?
                WHERE id = ?
            `).bind(name, description, reward_coins, reward_exp, type, target_action, target_count, is_active, id).run();

            return { success: true, message: "使命更新成功" };
        }

        if (action === "create") {
            const name = formData.get("name");
            const description = formData.get("description");
            const reward_coins = parseInt(formData.get("reward_coins") as string);
            const reward_exp = parseInt(formData.get("reward_exp") as string);
            const type = formData.get("type");
            const target_action = formData.get("target_action");
            const target_count = parseInt(formData.get("target_count") as string);

            await anime_db.prepare(`
                INSERT INTO missions (name, description, reward_coins, reward_exp, type, target_action, target_count, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `).bind(name, description, reward_coins, reward_exp, type, target_action, target_count).run();

            return { success: true, message: "新使命创建成功" };
        }

        if (action === "delete") {
            const id = formData.get("id");
            await anime_db.prepare("DELETE FROM missions WHERE id = ?").bind(id).run();
            return { success: true, message: "使命已废弃" };
        }

        return { success: false, error: "未知操作" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Component ---
export default function AdminMissions() {
    const { missions } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [editingMission, setEditingMission] = useState<Mission | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success(fetcher.data.message);
            setEditingMission(null);
            setIsAdding(false);
        } else if (fetcher.data?.error) {
            toast.error(fetcher.data.error);
        }
    }, [fetcher.data]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Trophy className="text-yellow-500" />
                        任务管理
                    </h1>
                    <p className="text-white/50 text-sm mt-1">管理前端展示的所有任务及其奖励数据</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all active:scale-95"
                >
                    <Plus size={18} /> 新增任务
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {missions.map((mission) => (
                    <motion.div
                        key={mission.id}
                        layout
                        className={`p-6 bg-[#0f1629]/80 backdrop-blur-xl border rounded-2xl flex items-center justify-between transition-all ${mission.is_active ? "border-white/5" : "border-red-500/20 opacity-60"}`}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-lg 
                                ${mission.type === 'daily' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    mission.type === 'weekly' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}
                            `}>
                                {mission.type.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {mission.name}
                                    {!mission.is_active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase">已停用</span>}
                                </h3>
                                <p className="text-sm text-white/40">{mission.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
                                    <span className="text-emerald-400">💰 {mission.reward_coins} Coins</span>
                                    <span className="text-blue-400">✨ {mission.reward_exp} EXP</span>
                                    <span className="text-violet-400">🎯 {mission.target_action} x{mission.target_count}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditingMission(mission)}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            >
                                <Edit3 size={18} />
                            </button>
                            <fetcher.Form method="post" onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                confirmModal({ title: "危险操作", message: "确定要废弃此使命吗？" }).then(res => {
                                    if (res) fetcher.submit(form);
                                });
                            }}>
                                <input type="hidden" name="action" value="delete" />
                                <input type="hidden" name="id" value={mission.id} />
                                <button className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </fetcher.Form>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Edit / Add Modal */}
            <AnimatePresence>
                {(editingMission || isAdding) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => { setEditingMission(null); setIsAdding(false); }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-[#1e293b] border border-white/10 rounded-[32px] p-8 relative z-10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    {isAdding ? <Plus className="text-emerald-400" /> : <Edit3 className="text-blue-400" />}
                                    {isAdding ? "发布全新使命" : "修正使命参数"}
                                </h2>
                                <button onClick={() => { setEditingMission(null); setIsAdding(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} className="text-white/40" />
                                </button>
                            </div>

                            <fetcher.Form method="post" className="space-y-6">
                                <input type="hidden" name="action" value={isAdding ? "create" : "update"} />
                                {editingMission && <input type="hidden" name="id" value={editingMission.id} />}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">使命名称</label>
                                        <input
                                            name="name"
                                            defaultValue={editingMission?.name}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">周期类型</label>
                                        <select
                                            name="type"
                                            defaultValue={editingMission?.type || "daily"}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 outline-none transition-all appearance-none"
                                        >
                                            <option value="daily">每日 (Daily)</option>
                                            <option value="weekly">每周 (Weekly)</option>
                                            <option value="monthly">每月 (Monthly)</option>
                                            <option value="achievement">成就 (Achievement)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase ml-1">使命情报 (描述)</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingMission?.description}
                                        rows={2}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">目标动作</label>
                                        <input
                                            name="target_action"
                                            defaultValue={editingMission?.target_action}
                                            required
                                            placeholder="signin / comment / watch"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">目标次数</label>
                                        <input
                                            type="number"
                                            name="target_count"
                                            defaultValue={editingMission?.target_count}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 flex items-end">
                                        <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full cursor-pointer hover:bg-white/10 transition-all">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                value="true"
                                                defaultChecked={editingMission ? editingMission.is_active === 1 : true}
                                                className="w-4 h-4 rounded border-white/20 bg-transparent text-violet-500"
                                            />
                                            <span className="text-sm font-bold text-white/80">激活使命</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-6 bg-black/20 rounded-2xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">金币奖励 (Coins)</label>
                                        <input
                                            type="number"
                                            name="reward_coins"
                                            defaultValue={editingMission?.reward_coins}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-bold focus:border-emerald-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase ml-1">经验奖励 (EXP)</label>
                                        <input
                                            type="number"
                                            name="reward_exp"
                                            defaultValue={editingMission?.reward_exp}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-blue-400 font-bold focus:border-blue-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-violet-100 transition-all flex items-center justify-center gap-3 shadow-xl"
                                    disabled={fetcher.state !== 'idle'}
                                >
                                    {fetcher.state !== 'idle' ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    {isAdding ? "部署新使命" : "同步修改至星尘网络"}
                                </button>
                            </fetcher.Form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
