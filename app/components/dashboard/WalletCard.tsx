import { motion } from "framer-motion";
import { Wallet, Plus, CreditCard, History } from "lucide-react";
import { Link } from "react-router";

interface WalletCardProps {
    coins: number;
}

export function WalletCard({ coins }: WalletCardProps) {
    return (
        <motion.div
            className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            {/* 背景装饰 */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl" />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-yellow-500" />
                        我的钱包
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        当前余额
                    </p>
                </div>
                <Link
                    to="/wallet"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="交易记录"
                >
                    <History className="w-5 h-5 text-slate-400" />
                </Link>
            </div>

            <div className="flex items-end gap-2 mb-8">
                <span className="text-4xl font-bold text-slate-800 dark:text-white font-display">
                    {coins.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500 mb-2">星尘</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Link
                    to="/wallet/recharge"
                    className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    充值
                </Link>
                <Link
                    to="/shop"
                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <CreditCard className="w-4 h-4" />
                    商城
                </Link>
            </div>
        </motion.div>
    );
}
