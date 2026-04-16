import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, Sparkles, Moon, Orbit } from "lucide-react";

interface Tier {
  tier_id: number;
  tier_name: string;
  tier_name_en: string;
  tier_level: number;
  monthly_price_cents: number;
  yearly_price_cents: number;
  description: string;
  features: string[];
  color_hex: string;
}

interface MembershipTierCardProps {
  tier: Tier;
  isCurrentTier?: boolean;
  isPopular?: boolean;
  onSubscribe?: (tier: Tier) => void;
  compact?: boolean;
}

const tierIcons = [Star, Moon, Zap, Crown];
const tierGradients: Record<number, { from: string; to: string }> = {
  0: { from: "from-slate-500/20", to: "to-slate-600/10" },
  1: { from: "from-purple-500/20", to: "to-violet-600/10" },
  2: { from: "from-blue-500/20", to: "to-cyan-600/10" },
  3: { from: "from-amber-500/20", to: "to-orange-600/10" },
};

export function MembershipTierCard({
  tier,
  isCurrentTier = false,
  isPopular = false,
  onSubscribe,
  compact = false,
}: MembershipTierCardProps) {
  const price = tier.monthly_price_cents / 100;
  const yearlyPrice = tier.yearly_price_cents / 100;
  const savingsPercent =
    yearlyPrice > 0
      ? Math.round((1 - yearlyPrice / (price * 12)) * 100)
      : 0;

  const Icon = tierIcons[tier.tier_level] || Star;
  const gradient = tierGradients[tier.tier_level] || tierGradients[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative rounded-2xl backdrop-blur-xl border transition-all duration-300
        ${isPopular
          ? `bg-gradient-to-b ${gradient.from} ${gradient.to} border-yellow-500/40 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.15)] z-10`
          : `bg-white/10 border-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`
        }
        ${isCurrentTier && tier.tier_level > 0 ? "ring-2 ring-green-500/50" : ""}
        ${compact ? "p-5" : "p-6 lg:p-8"}
      `}
    >
      {/* 推荐标记 */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full text-xs font-bold text-black shadow-lg z-20">
          推荐
        </div>
      )}

      {/* 当前会员标记 */}
      {isCurrentTier && tier.tier_level > 0 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-xs font-bold text-white shadow-lg z-20">
          当前
        </div>
      )}

      {/* 等级图标 */}
      <div
        className={`
          ${compact ? "w-12 h-12" : "w-16 h-16"}
          rounded-2xl flex items-center justify-center mb-4 mx-auto
          ${isPopular ? "shadow-lg" : ""}
        `}
        style={{ backgroundColor: `${tier.color_hex}20` }}
      >
        <Icon
          size={compact ? 24 : 32}
          style={{ color: tier.color_hex }}
        />
      </div>

      {/* 等级名称 */}
      <div className="text-center mb-3">
        <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold text-white mb-1`}>
          {tier.tier_name}
        </h3>
        <p className="text-sm text-white/50">{tier.tier_name_en}</p>
      </div>

      {/* 价格 */}
      <div className="text-center mb-4">
        {tier.tier_level === 0 ? (
          <div className="text-2xl font-bold text-white">免费</div>
        ) : (
          <>
            <span className={`${compact ? "text-2xl" : "text-3xl"} font-bold text-white`}>
              ¥{price}
            </span>
            <span className="text-white/60">/月</span>
            {yearlyPrice > 0 && savingsPercent > 0 && (
              <p className="text-xs text-white/40 mt-1">
                或 ¥{yearlyPrice}/年（省{savingsPercent}%）
              </p>
            )}
          </>
        )}
      </div>

      {/* 简介 */}
      <p className={`${compact ? "text-xs" : "text-sm"} text-white/70 text-center mb-4`}>
        {tier.description}
      </p>

      {/* 功能列表 */}
      <ul className={`space-y-2 mb-4 ${compact ? "text-xs" : "text-sm"}`}>
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check
              size={compact ? 14 : 16}
              className="mt-0.5 flex-shrink-0"
              style={{ color: tier.color_hex }}
            />
            <span className="text-white/80">{feature}</span>
          </li>
        ))}
      </ul>

      {/* 操作按钮 */}
      <button
        onClick={() => onSubscribe?.(tier)}
        disabled={isCurrentTier && tier.tier_level > 0}
        className={`
          w-full ${compact ? "py-2" : "py-3"} rounded-xl font-bold transition-all duration-300
          ${isCurrentTier && tier.tier_level > 0
            ? "bg-white/10 text-white/50 cursor-not-allowed"
            : "text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          }
        `}
        style={
          !isCurrentTier || tier.tier_level === 0
            ? {
                background: `linear-gradient(to right, ${tier.color_hex}, ${tier.color_hex}cc)`,
              }
            : undefined
        }
      >
        {isCurrentTier && tier.tier_level > 0
          ? "已是会员"
          : tier.tier_level === 0
            ? "免费体验"
            : "立即升级"
        }
      </button>
    </motion.div>
  );
}

// 四级会员列表卡片组件
interface MembershipTierListProps {
  tiers: Tier[];
  currentTierLevel?: number;
  popularLevel?: number;
  onSubscribe?: (tier: Tier) => void;
}

export function MembershipTierList({
  tiers,
  currentTierLevel = 0,
  popularLevel = 2,
  onSubscribe,
}: MembershipTierListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => (
        <MembershipTierCard
          key={tier.tier_id}
          tier={tier}
          isCurrentTier={tier.tier_level <= currentTierLevel}
          isPopular={tier.tier_level === popularLevel}
          onSubscribe={onSubscribe}
        />
      ))}
    </div>
  );
}

// 紧凑版卡片网格（用于侧边或小空间）
export function MembershipTierGrid({
  tiers,
  currentTierLevel = 0,
  popularLevel = 2,
  onSubscribe,
}: MembershipTierListProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => (
        <MembershipTierCard
          key={tier.tier_id}
          tier={tier}
          isCurrentTier={tier.tier_level <= currentTierLevel}
          isPopular={tier.tier_level === popularLevel}
          onSubscribe={onSubscribe}
          compact
        />
      ))}
    </div>
  );
}