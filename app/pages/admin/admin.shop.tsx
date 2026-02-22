import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { ShoppingBag, Plus, Trash2, Edit3, Save, X, Package, Tag, Layers, Loader2, Upload } from "lucide-react";
import { toast } from "~/components/ui/Toast";
import { confirmModal } from "~/components/ui/Modal";

// --- Types ---
interface ShopItem {
    id: number;
    name: string;
    description: string;
    price_coins: number;
    type: string;
    image_url: string;
    is_active: number;
    metadata: string;
}

// --- Loader ---
export async function loader({ request, context }: any) {
    const { anime_db } = context.cloudflare.env;
    const items = await anime_db.prepare("SELECT * FROM shop_items ORDER BY type, id").all();
    return { items: items.results as ShopItem[] };
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
            const price_coins = parseInt(formData.get("price_coins") as string);
            const type = formData.get("type");
            const image_url = formData.get("image_url");
            const is_active = formData.get("is_active") === "true" ? 1 : 0;
            const metadata = formData.get("metadata");

            await anime_db.prepare(`
                UPDATE shop_items SET 
                name = ?, description = ?, price_coins = ?, type = ?, 
                image_url = ?, is_active = ?, metadata = ?
                WHERE id = ?
            `).bind(name, description, price_coins, type, image_url, is_active, metadata, id).run();

            return { success: true, message: "商品参数已更新" };
        }

        if (action === "create") {
            const name = formData.get("name");
            const description = formData.get("description");
            const price_coins = parseInt(formData.get("price_coins") as string);
            const type = formData.get("type");
            const image_url = formData.get("image_url");
            const metadata = formData.get("metadata") || "{}";

            await anime_db.prepare(`
                INSERT INTO shop_items (name, description, price_coins, type, image_url, is_active, metadata)
                VALUES (?, ?, ?, ?, ?, 1, ?)
            `).bind(name, description, price_coins, type, image_url, metadata).run();

            return { success: true, message: "新道具已入库" };
        }

        if (action === "delete") {
            const id = formData.get("id");
            await anime_db.prepare("DELETE FROM shop_items WHERE id = ?").bind(id).run();
            return { success: true, message: "商品已永久下架" };
        }

        return { success: false, error: "未知指令" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Component ---
export default function AdminShop() {
    const { items } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success(fetcher.data.message);
            setEditingItem(null);
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
                        <ShoppingBag className="text-pink-500" />
                        星尘仓库管理
                    </h1>
                    <p className="text-white/50 text-sm mt-1">控制全站道具定价、库存及视觉素材指向</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-95"
                >
                    <Plus size={18} /> 新道具入库
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        layout
                        className={`p-6 bg-[#0f1629]/80 backdrop-blur-xl border rounded-[32px] flex flex-col gap-4 transition-all group ${item.is_active ? "border-white/5" : "border-red-500/20 grayscale opacity-60"}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border
                                ${item.type === 'avatar_frame' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    item.type === 'theme' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                        'bg-amber-500/20 text-amber-400 border-amber-500/30'}
                            `}>
                                {item.type === 'avatar_frame' ? '🖼️' : item.type === 'theme' ? '🎨' : '📦'}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingItem(item)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"><Edit3 size={16} /></button>
                                <fetcher.Form method="post" onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    confirmModal({ title: "危险操作", message: "确定要下架并销毁此商品吗？" }).then(res => {
                                        if (res) fetcher.submit(form);
                                    });
                                }}>
                                    <input type="hidden" name="action" value="delete" />
                                    <input type="hidden" name="id" value={item.id} />
                                    <button className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                                </fetcher.Form>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {item.name}
                                {!item.is_active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">OFFLINE</span>}
                            </h3>
                            <p className="text-sm text-white/40 line-clamp-2 mt-1">{item.description}</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="text-amber-400 font-black text-lg flex items-center gap-1">
                                <Tag size={16} /> {item.price_coins} <span className="text-[10px] font-medium text-amber-400/50">COINS</span>
                            </div>
                            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{item.type}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {(editingItem || isAdding) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => { setEditingItem(null); setIsAdding(false); }} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl bg-[#111827] border border-white/10 rounded-[40px] p-10 relative z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                    {isAdding ? "新增商品" : "编辑商品信息"}
                                </h2>
                                <button onClick={() => { setEditingItem(null); setIsAdding(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-white/40" /></button>
                            </div>

                            <fetcher.Form method="post" className="space-y-6">
                                <input type="hidden" name="action" value={isAdding ? "create" : "update"} />
                                {editingItem && <input type="hidden" name="id" value={editingItem.id} />}

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">商品名称</label>
                                        <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-pink-500/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">商品类别</label>
                                        <select name="type" defaultValue={editingItem?.type || "prop"} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-pink-500/50 outline-none transition-all appearance-none">
                                            <option value="avatar_frame">🖼️ 头像框</option>
                                            <option value="theme">🎨 主题/壁纸</option>
                                            <option value="prop">📦 消耗品/道具</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">详情描述</label>
                                    <textarea name="description" defaultValue={editingItem?.description} rows={2} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-pink-500/50 outline-none transition-all resize-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">价格 (Coins)</label>
                                        <input type="number" name="price_coins" defaultValue={editingItem?.price_coins} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-amber-400 font-black focus:border-amber-500/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">素材链接 (URL)</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = async (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (!file) return;
                                                        toast.info("正在上传图片...");
                                                        const formData = new FormData();
                                                        formData.append("file", file);
                                                        try {
                                                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                                                            const data = await res.json() as any;
                                                            if (data.success && data.url) {
                                                                const urlInput = document.getElementById('image_url_input') as HTMLInputElement;
                                                                if (urlInput) {
                                                                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                                                                    nativeInputValueSetter?.call(urlInput, data.url);
                                                                    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
                                                                }
                                                                toast.success("上传成功！");
                                                            } else {
                                                                toast.error("上传错误: " + data.error);
                                                            }
                                                        } catch (err) {
                                                            toast.error("网络异常，上传失败");
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                                className="text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 bg-pink-500/10 px-2 py-0.5 rounded-full ring-1 ring-pink-500/30"
                                            >
                                                <Upload size={10} /> 直传图床
                                            </button>
                                        </div>
                                        <input id="image_url_input" name="image_url" defaultValue={editingItem?.image_url} placeholder="若无则使用 CSS 渲染" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white/60 focus:border-pink-500/50 outline-none transition-all text-xs" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">配置元数据 (JSON Metadata)</label>
                                    <input name="metadata" defaultValue={editingItem?.metadata || "{}"} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-pink-300 font-mono text-xs focus:border-pink-500/50 outline-none transition-all" />
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 cursor-pointer hover:bg-white/10 transition-all flex-1">
                                        <input type="checkbox" name="is_active" value="true" defaultChecked={editingItem ? editingItem.is_active === 1 : true} className="w-5 h-5 rounded border-white/20 bg-transparent text-pink-500" />
                                        <span className="text-sm font-black text-white/70 uppercase">上架展示</span>
                                    </label>
                                    <button className="flex-[2] py-4 bg-white text-black rounded-2xl font-black tracking-widest uppercase hover:bg-pink-100 transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.2)]" disabled={fetcher.state !== 'idle'}>
                                        {fetcher.state !== 'idle' ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        {isAdding ? "执行上架申请" : "同步参数修改"}
                                    </button>
                                </div>
                            </fetcher.Form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
