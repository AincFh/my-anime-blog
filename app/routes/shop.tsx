/**
 * 积分商城页面
 * 用户可以使用积分兑换各种虚拟商品
 */

import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import type { Route } from "./+types/shop";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles, Gift, Star, Check, AlertCircle, Package } from "lucide-react";

export async function loader({ request, context }: Route.LoaderArgs) {
    const { verifySession, getSessionToken } = await import("~/services/auth.server");
    const { getUserCoins } = await import("~/services/membership/coins.server");

    const db = context.cloudflare.env.anime_db;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, db);

    // 获取商城商品
    const itemsResult = await db
        .prepare(`
            SELECT * FROM shop_items 
            WHERE is_active = 1 
            ORDER BY sort_order, price_coins
        `)
        .all();

    // 获取用户积分和购买记录
    let userCoins = 0;
    let userPurchases: number[] = [];

    if (valid && user) {
        userCoins = await getUserCoins(db, user.id);

        const purchasesResult = await db
            .prepare(`SELECT item_id FROM user_purchases WHERE user_id = ?`)
            .bind(user.id)
            .all();

        userPurchases = (purchasesResult.results || []).map((p: any) => p.item_id);
    }

    return {
        user: valid ? user : null,
        coins: userCoins,
        items: itemsResult.results || [],
        userPurchases,
    };
}

export async function action({ request, context }: Route.ActionArgs) {
    const { verifySession, getSessionToken } = await import("~/services/auth.server");
    const { getUserCoins, spendCoins } = await import("~/services/membership/coins.server");

    const db = context.cloudflare.env.anime_db;
    const token = getSessionToken(request);
    const { valid, user } = await verifySession(token, db);

    if (!valid || !user) {
        return { success: false, error: "请先登录" };
    }

    const formData = await request.formData();
    const itemId = Number(formData.get("itemId"));

    if (!itemId) {
        return { success: false, error: "商品不存在" };
    }

    // 获取商品信息
    const item = await db
        .prepare(`SELECT * FROM shop_items WHERE id = ? AND is_active = 1`)
        .bind(itemId)
        .first();

    if (!item) {
        return { success: false, error: "商品不存在或已下架" };
    }

    // 检查是否已拥有（一次性商品）
    if (item.type === 'badge' || item.type === 'theme' || item.type === 'effect') {
        const existing = await db
            .prepare(`SELECT id FROM user_purchases WHERE user_id = ? AND item_id = ?`)
            .bind(user.id, itemId)
            .first();

        if (existing) {
            return { success: false, error: "你已经拥有此商品" };
        }
    }

    // 检查积分是否足够
    const userCoins = await getUserCoins(db, user.id);
    if (userCoins < item.price_coins) {
        return { success: false, error: `积分不足，需要 ${item.price_coins} 积分` };
    }

    // 扣除积分
    const consumeResult = await spendCoins(
        db,
        user.id,
        item.price_coins,
        'purchase',
        `购买商品: ${item.name}`
    );

    if (!consumeResult.success) {
        return { success: false, error: consumeResult.error };
    }

    // 记录购买
    await db
        .prepare(`
            INSERT INTO user_purchases (user_id, item_id, price_paid, created_at)
            VALUES (?, ?, ?, ?)
        `)
        .bind(user.id, itemId, item.price_coins, Math.floor(Date.now() / 1000))
        .run();

    // 更新商品库存（如果有限制）
    if (item.stock !== null && item.stock > 0) {
        await db
            .prepare(`UPDATE shop_items SET stock = stock - 1 WHERE id = ?`)
            .bind(itemId)
            .run();
    }

    return { success: true, message: `成功兑换「${item.name}」！` };
}

export default function ShopPage() {
    const { user, coins, items, userPurchases } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { key: 'all', label: '全部', icon: '🛒' },
        { key: 'badge', label: '徽章', icon: '🏅' },
        { key: 'theme', label: '主题', icon: '🎨' },
        { key: 'effect', label: '特效', icon: '✨' },
        { key: 'consumable', label: '消耗品', icon: '🎁' },
    ];

    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter((item: any) => item.type === selectedCategory);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'badge': return 'from-amber-500 to-orange-500';
            case 'theme': return 'from-purple-500 to-pink-500';
            case 'effect': return 'from-blue-500 to-cyan-500';
            case 'consumable': return 'from-green-500 to-emerald-500';
            default: return 'from-gray-500 to-slate-500';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'badge': return '徽章';
            case 'theme': return '主题';
            case 'effect': return '特效';
            case 'consumable': return '消耗品';
            default: return '其他';
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* 顶部信息栏 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <ShoppingBag className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">积分商城</h1>
                                <p className="text-slate-500 dark:text-slate-400">使用积分兑换专属好礼</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <span className="text-2xl font-bold text-amber-500">{coins.toLocaleString()}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">积分</span>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-6 py-3 bg-primary-start hover:bg-primary-end text-white rounded-xl font-medium transition-colors"
                                >
                                    登录查看积分
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 分类标签 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-2"
                >
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.key
                                ? 'bg-primary-start text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* 商品列表 */}
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item: any, index: number) => {
                            const isOwned = userPurchases.includes(item.id);
                            const canAfford = coins >= item.price_coins;
                            const isOutOfStock = item.stock !== null && item.stock <= 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    whileHover={{ y: -5 }}
                                    className={`glass-card rounded-2xl overflow-hidden relative ${isOwned ? 'ring-2 ring-green-500/50' : ''
                                        }`}
                                >
                                    {/* 类型标签 */}
                                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTypeColor(item.type)}`}>
                                        {getTypeLabel(item.type)}
                                    </div>

                                    {/* 已拥有标记 */}
                                    {isOwned && (
                                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    {/* 商品图片 */}
                                    <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-6xl opacity-50">
                                                {item.type === 'badge' && '🏅'}
                                                {item.type === 'theme' && '🎨'}
                                                {item.type === 'effect' && '✨'}
                                                {item.type === 'consumable' && '🎁'}
                                            </div>
                                        )}
                                    </div>

                                    {/* 商品信息 */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">{item.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                            {item.description || '暂无描述'}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500" />
                                                <span className="font-bold text-amber-500">{item.price_coins}</span>
                                                <span className="text-xs text-slate-400">积分</span>
                                            </div>

                                            {item.stock !== null && (
                                                <span className="text-xs text-slate-400">
                                                    库存: {item.stock}
                                                </span>
                                            )}
                                        </div>

                                        {/* 兑换按钮 */}
                                        {user ? (
                                            <fetcher.Form method="post" className="mt-3">
                                                <input type="hidden" name="itemId" value={item.id} />
                                                <button
                                                    type="submit"
                                                    disabled={isOwned || !canAfford || isOutOfStock || fetcher.state !== 'idle'}
                                                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${isOwned
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 cursor-not-allowed'
                                                        : isOutOfStock
                                                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 cursor-not-allowed'
                                                            : !canAfford
                                                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25'
                                                        }`}
                                                >
                                                    {fetcher.state !== 'idle' ? (
                                                        '处理中...'
                                                    ) : isOwned ? (
                                                        <span className="flex items-center justify-center gap-1">
                                                            <Check className="w-4 h-4" /> 已拥有
                                                        </span>
                                                    ) : isOutOfStock ? (
                                                        '已售罄'
                                                    ) : !canAfford ? (
                                                        '积分不足'
                                                    ) : (
                                                        '立即兑换'
                                                    )}
                                                </button>
                                            </fetcher.Form>
                                        ) : (
                                            <Link
                                                to="/login"
                                                className="block mt-3 py-2.5 text-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                                登录后兑换
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-12 rounded-2xl text-center"
                    >
                        <Package className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">暂无商品</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            商城正在补货中，请稍后再来看看~
                        </p>
                    </motion.div>
                )}

                {/* 底部说明 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-sm text-slate-500 dark:text-slate-400 space-y-2"
                >
                    <p>💡 积分可通过每日登录、完成任务等方式获得</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/user/membership" className="hover:text-primary-start transition-colors">
                            会员中心
                        </Link>
                        <span>·</span>
                        <Link to="/legal/sponsor" className="hover:text-primary-start transition-colors">
                            赞助条款
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* 操作反馈 Toast */}
            <AnimatePresence>
                {fetcher.data && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${fetcher.data.success
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        {fetcher.data.success ? (
                            <>
                                <Gift className="w-5 h-5" />
                                {fetcher.data.message}
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                {fetcher.data.error}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
