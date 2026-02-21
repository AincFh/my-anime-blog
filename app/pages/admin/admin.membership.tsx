import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { Crown, Edit3, Save, X, Palette, DollarSign, Settings, ShieldCheck, Loader2, List } from "lucide-react";
import { toast } from "~/components/ui/Toast";

// --- Types ---
interface MembershipTier {
    id: number;
    name: string;
    display_name: string;
    description: string;
    price_monthly: number;
    price_quarterly: number;
    price_yearly: number;
    privileges: string;
    badge_url: string;
    badge_color: string;
    sort_order: number;
    is_active: number;
}

// --- Loader ---
export async function loader({ request, context }: any) {
    const { anime_db } = context.cloudflare.env;
    const tiers = await anime_db.prepare("SELECT * FROM membership_tiers ORDER BY sort_order ASC").all();
    return { tiers: tiers.results as MembershipTier[] };
}

// --- Action ---
export async function action({ request, context }: any) {
    const { anime_db } = context.cloudflare.env;
    const formData = await request.formData();
    const action = formData.get("action");

    try {
        if (action === "update") {
            const id = formData.get("id");
            const display_name = formData.get("display_name");
            const description = formData.get("description");
            const price_monthly = parseFloat(formData.get("price_monthly") as string);
            const price_quarterly = parseFloat(formData.get("price_quarterly") as string);
            const price_yearly = parseFloat(formData.get("price_yearly") as string);
            const privileges = formData.get("privileges");
            const badge_color = formData.get("badge_color");
            const sort_order = parseInt(formData.get("sort_order") as string);

            await anime_db.prepare(`
                UPDATE membership_tiers SET 
                display_name = ?, description = ?, price_monthly = ?, 
                price_quarterly = ?, price_yearly = ?, privileges = ?, 
                badge_color = ?, sort_order = ?
                WHERE id = ?
            `).bind(display_name, description, price_monthly, price_quarterly, price_yearly, privileges, badge_color, sort_order, id).run();

            return { success: true, message: "会员权益已动态同步" };
        }
        return { success: false, error: "未授命的操作" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Component ---
export default function AdminMembership() {
    const { tiers } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);

    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success(fetcher.data.message);
            setEditingTier(null);
        } else if (fetcher.data?.error) {
            toast.error(fetcher.data.error);
        }
    }, [fetcher.data]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
                        <Crown className="text-yellow-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                        会员特权协议
                    </h1>
                    <p className="text-white/40 text-sm mt-2 font-medium">上帝模式：重写会员等级、权益 JSON 及全球定价策略</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {tiers.map((tier) => (
                    <motion.div
                        key={tier.id}
                        layout
                        className="group relative bg-[#0f172a]/60 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden hover:border-violet-500/30 transition-all p-8 flex flex-col gap-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div
                                    className="w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-2xl relative overflow-hidden"
                                    style={{ backgroundColor: tier.badge_color + '20', color: tier.badge_color, border: `1px solid ${tier.badge_color}40` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                    {tier.name === 'free' ? '👤' : tier.name === 'vip' ? '👑' : '💎'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">{tier.display_name}</h2>
                                    <p className="text-xs text-white/30 font-mono uppercase tracking-widest mt-1">Tier System ID: {tier.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingTier(tier)}
                                className="p-4 rounded-2xl bg-white/5 hover:bg-violet-500/20 text-white/40 hover:text-violet-400 transition-all border border-white/5 group"
                            >
                                <Edit3 size={20} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>

                        <p className="text-sm text-white/50 leading-relaxed italic">“{tier.description || '暂无描述信息'}”</p>

                        <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                            <div className="text-center">
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Monthly</p>
                                <p className="text-lg font-bold text-white tracking-tighter">¥{tier.price_monthly}</p>
                            </div>
                            <div className="text-center border-x border-white/5">
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Quarterly</p>
                                <p className="text-lg font-bold text-white tracking-tighter">¥{tier.price_quarterly}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Yearly</p>
                                <p className="text-lg font-bold text-white tracking-tighter">¥{tier.price_yearly}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] text-violet-400 font-black uppercase tracking-[0.2em]">Active Privileges</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(JSON.parse(tier.privileges || '{}')).map(([key, val]) => (
                                    <span key={key} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60">
                                        {key}: <span className="text-violet-300">{String(val)}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {editingTier && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setEditingTier(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="w-full max-w-4xl bg-[#0a0f1e] border border-white/10 rounded-[48px] p-12 relative z-10 shadow-[0_0_100px_rgba(139,92,246,0.2)] overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none" />

                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                                    <ShieldCheck className="text-violet-500 w-8 h-8" />
                                    Protocol Overwrite: {editingTier.display_name}
                                </h2>
                                <button onClick={() => setEditingTier(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors group"><X size={24} className="text-white/40 group-hover:text-white" /></button>
                            </div>

                            <fetcher.Form method="post" className="space-y-8 h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                <input type="hidden" name="action" value="update" />
                                <input type="hidden" name="id" value={editingTier.id} />

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Display Name</label>
                                            <input name="display_name" defaultValue={editingTier.display_name} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-violet-500/50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Status Color (Hex)</label>
                                            <div className="flex gap-4">
                                                <input name="badge_color" defaultValue={editingTier.badge_color} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-violet-400 font-mono focus:border-violet-500/50 outline-none transition-all" />
                                                <div className="w-14 h-14 rounded-2xl border border-white/20" style={{ backgroundColor: editingTier.badge_color }} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-white/30 font-bold uppercase truncate">Price Mo</label>
                                                <input type="number" step="0.01" name="price_monthly" defaultValue={editingTier.price_monthly} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-white/30 font-bold uppercase truncate">Price Qu</label>
                                                <input type="number" step="0.01" name="price_quarterly" defaultValue={editingTier.price_quarterly} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-white/30 font-bold uppercase truncate">Price Yr</label>
                                                <input type="number" step="0.01" name="price_yearly" defaultValue={editingTier.price_yearly} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Sort Order</label>
                                            <input type="number" name="sort_order" defaultValue={editingTier.sort_order} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-violet-500/50 outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Privileges JSON Map</label>
                                            <textarea
                                                name="privileges"
                                                defaultValue={editingTier.privileges}
                                                rows={12}
                                                className="w-full bg-black/40 border border-white/10 rounded-[32px] p-8 text-violet-300 font-mono text-xs focus:border-violet-500/50 outline-none transition-all leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Tier Description</label>
                                    <textarea name="description" defaultValue={editingTier.description} rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-violet-500/50 outline-none transition-all resize-none italic" />
                                </div>

                                <button
                                    className="w-full py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-3xl font-black tracking-[0.3em] uppercase hover:shadow-[0_20px_50px_-10px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                                    disabled={fetcher.state !== 'idle'}
                                >
                                    {fetcher.state !== 'idle' ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                    Commit High-Level Overwrite
                                </button>
                            </fetcher.Form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
