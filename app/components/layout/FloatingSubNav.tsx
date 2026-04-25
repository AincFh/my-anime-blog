'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Share2, Eye, Star, ShoppingCart, Settings, Wallet, Trophy } from 'lucide-react';
import { cn } from '~/utils/cn';

export interface FloatingSubNavProps {
  title: string;
  leftIcon?: 'none';
  rightContent?: React.ReactNode;
  transparent?: boolean;
}

export function FloatingSubNav({
  title,
  leftIcon = 'none',
  rightContent,
  transparent = false,
}: FloatingSubNavProps) {

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          y: -60,
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          y: 0,
          opacity: 1,
          scale: 1,
        }}
        exit={{
          y: -60,
          opacity: 0,
          scale: 0.9,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          mass: 0.8,
        }}
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] h-[56px]',
          'flex items-center justify-between px-4',
          'transition-all duration-300',
          transparent
            ? 'bg-transparent'
            : 'bg-white/80 dark:bg-[rgba(37,40,54,0.92)] dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-black/20'
        )}
      >
        {/* 左侧占位 */}
        <div className="w-[80px]" />

        {/* 中间 - 标题（移动端） */}
        <div className={cn(
          'absolute left-1/2 -translate-x-1/2 max-w-[200px] truncate',
          'text-[15px] font-bold',
          !transparent && 'text-slate-700 dark:text-slate-200',
          transparent && 'text-white/90'
        )}>
          {title}
        </div>

        {/* 右侧 - 自定义内容 */}
        <div className="flex items-center gap-1">
          {rightContent}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== 预设的快捷导航组件 ====================

// 文章详情页导航
export function ArticleSubNav({
  title,
  isLiked,
  likeCount,
  onLike,
  onShare,
}: {
  title: string;
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  onShare: () => void;
}) {
  return (
    <FloatingSubNav
      title={title}
      rightContent={
        <>
          <button
            onClick={onLike}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95',
              isLiked
                ? 'bg-rose-500/20 text-rose-500'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isLiked && 'fill-current')} />
            <span className="hidden xs:inline">{likeCount}</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-200 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </>
      }
    />
  );
}

// 番剧详情页导航
export function BangumiSubNav({
  title,
  status,
  onStatusChange,
}: {
  title: string;
  status: 'watching' | 'completed' | 'plan' | 'dropped';
  onStatusChange: (status: string) => void;
}) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    watching: { label: '在看', color: 'text-emerald-500 bg-emerald-500/20' },
    completed: { label: '看过', color: 'text-blue-500 bg-blue-500/20' },
    plan: { label: '想看', color: 'text-purple-500 bg-purple-500/20' },
    dropped: { label: '抛弃', color: 'text-red-500 bg-red-500/20' },
  };

  return (
    <FloatingSubNav
      title={title}
      rightContent={
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12px] font-bold border-none outline-none cursor-pointer transition-all',
              statusConfig[status]?.color
            )}
          >
            <option value="watching">在看</option>
            <option value="completed">看过</option>
            <option value="plan">想看</option>
            <option value="dropped">抛弃</option>
          </select>
        </div>
      }
    />
  );
}

// 用户中心子页面导航
export function UserSubNav({
  title,
  showWallet = false,
  showShop = false,
}: {
  title: string;
  showWallet?: boolean;
  showShop?: boolean;
}) {
  return (
    <FloatingSubNav
      title={title}
      rightContent={
        <div className="flex items-center gap-1">
          {showWallet && (
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95">
              <Wallet className="w-5 h-5" />
            </button>
          )}
          {showShop && (
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95">
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}
          <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      }
    />
  );
}

// 成就页面导航
export function AchievementSubNav() {
  return (
    <FloatingSubNav
      title="成就殿堂"
      rightContent={
        <div className="flex items-center gap-1 text-amber-400">
          <Trophy className="w-5 h-5" />
        </div>
      }
    />
  );
}

// 商城页面导航
export function ShopSubNav({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <FloatingSubNav
      title="星尘集市"
      rightContent={
        <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      }
    />
  );
}

// 钱包页面导航
export function WalletSubNav({ balance = 0 }: { balance?: number }) {
  return (
    <FloatingSubNav
      title="我的星尘"
      rightContent={
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[13px] font-bold shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all active:scale-95">
          <span>充值</span>
        </button>
      }
    />
  );
}
