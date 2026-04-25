/**
 * 赞助条款页面
 */

import { Heart, Gift, RefreshCw, XCircle } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
} from "~/components/legal/LegalPage";

export default function SponsorTermsPage() {
  return (
    <LegalPage
      title="赞助与会员"
      subtitle="Support & Membership"
      date="最后更新：2026年4月8日"
      icon={<Heart size={24} />}
      backTo="/user/membership"
      backText="返回会员中心"
    >
      <LegalSection icon={<Heart size={18} />} title="1. 性质说明" delay={0.05}>
        <LegalAlert type="info">
          本网站为<strong>个人非营利性项目</strong>。您通过本站进行的付费行为属于<strong>自愿赞助性质</strong>，
          旨在支持网站的运营和发展，并非商品或服务交易。
        </LegalAlert>
        <p className="mt-4 text-sm">
          赞助后获得的高级会员身份及相关权益，是对您赞助行为的感谢回馈，不构成商业合同关系。
          所有等级均可享受相应的功能提升。
        </p>
      </LegalSection>

      <LegalSection icon={<Gift size={18} />} title="2. 会员等级权益" delay={0.1}>
        {/* 旅行者 */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-3">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-slate-700 dark:text-white/80">旅行者</span>
            <span className="text-sm text-slate-500 dark:text-white/40">免费</span>
          </div>
          <ul className="text-sm text-slate-500 dark:text-white/50 space-y-1">
            <li>基础收藏夹（20条）</li>
            <li>每日图库访问 50 次</li>
            <li>每日 AI 聊天 3 次</li>
          </ul>
        </div>

        {/* 月之子 */}
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 mb-3">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-violet-600 dark:text-violet-400">月之子</span>
            <span className="text-sm text-violet-600 dark:text-violet-400">¥9.9/月</span>
          </div>
          <ul className="text-sm text-slate-500 dark:text-white/50 space-y-1">
            <li>云端收藏夹（200条）</li>
            <li>无限制图库访问</li>
            <li>每日 AI 聊天 20 次</li>
            <li>去除页面广告</li>
            <li>双倍星尘奖励</li>
          </ul>
        </div>

        {/* 星之守护者 */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 mb-3">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-blue-600 dark:text-blue-400">星之守护者</span>
            <span className="text-sm text-blue-600 dark:text-blue-400">¥29.9/月</span>
          </div>
          <ul className="text-sm text-slate-500 dark:text-white/50 space-y-1">
            <li>云端收藏夹（500条）</li>
            <li>无限制图库访问</li>
            <li>每日 AI 聊天 100 次</li>
            <li>付费内容抢先 7 天</li>
            <li>3 倍星尘奖励</li>
          </ul>
        </div>

        {/* 银河领主 */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/20">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-primary-start">银河领主</span>
            <span className="text-sm text-primary-start">¥49.9/月</span>
          </div>
          <ul className="text-sm text-slate-500 dark:text-white/50 space-y-1">
            <li>无限云端收藏夹</li>
            <li>无限制图库访问 + AI 聊天无限制</li>
            <li>付费内容完全解锁</li>
            <li>5 倍星尘奖励</li>
            <li>专属社区圈子 + 优先客服支持</li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection icon={<RefreshCw size={18} />} title="3. 自动续费" delay={0.15}>
        <p>若您开通了自动续费功能：</p>
        <LegalList numbered items={[
          "系统将在会员到期前 3 天通过邮件通知您即将续费",
          "若您不希望续费，请在到期前登录会员中心取消",
          "您可以随时取消自动续费，取消后当前周期内权益不受影响",
        ]} />
      </LegalSection>

      <LegalSection icon={<XCircle size={18} />} title="4. 退款政策" delay={0.2}>
        <LegalAlert type="warning">
          由于本赞助涉及虚拟权益的即时开通，原则上不支持退款。
        </LegalAlert>
        <p className="text-sm mt-4">
          特殊情况（如重复扣款、系统故障等）请联系我们处理，我们将在核实后 7 个工作日内给予答复。
        </p>
      </LegalSection>

      <LegalSection icon={<Gift size={18} />} title="5. 权益变更" delay={0.25}>
        <p>
          我们保留调整会员权益内容的权利。如有重大变更，将提前 7 天通知现有付费会员。
          现有会员在其已付费周期内享有原有权益。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
