/**
 * AI 服务条款页面
 */

import { Brain, Sparkles, AlertTriangle, Shield, FileText, User, Clock } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalGrid,
} from "~/components/legal/LegalPage";

export default function AIServiceTermsPage() {
    return (
    <LegalPage
      title="AI 服务条款"
      subtitle="AI Service Terms"
      date="最后更新：2026年4月8日"
      icon={<Brain size={24} />}
      secondaryLink={{ href: "/legal/disclaimer", text: "查看免责声明" }}
    >
      <LegalSection icon={<Sparkles size={18} />} title="1. 服务说明" delay={0.05}>
        <p>我们的 AI 服务基于大语言模型技术，为您提供以下功能：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "智能对话", desc: "AI 聊天助手" },
            { icon: "2", title: "内容辅助", desc: "写作建议生成" },
            { icon: "3", title: "信息查询", desc: "知识问答" },
            { icon: "4", title: "个性化", desc: "基于您的偏好" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<AlertTriangle size={18} />} title="2. 免责声明" delay={0.1}>
        <LegalAlert type="danger" title="AI 生成内容仅供参考">
          AI 生成的回答可能包含不准确、过时、错误或虚构的信息。我们不对 AI 输出内容的准确性、完整性、及时性作出任何保证。
        </LegalAlert>
        <LegalAlert type="danger" title="不得作为专业建议的依据" className="mt-3">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>医疗健康</strong>：不能替代医生诊断</li>
            <li><strong>法律咨询</strong>：不能替代律师意见</li>
            <li><strong>财务投资</strong>：不能替代专业顾问</li>
            <li><strong>心理健康</strong>：请寻求专业机构</li>
                                </ul>
        </LegalAlert>
        <LegalAlert type="warning" title="服务可用性" className="mt-3">
          AI 服务可能因技术原因出现中断、延迟或错误。我们保留在不通知的情况下暂停或调整 AI 服务的权利。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Shield size={18} />} title="3. 使用限制" delay={0.15}>
        <p>您在使用 AI 服务时，必须遵守以下规定：</p>
        <LegalList numbered items={[
          "禁止生成违法内容：不得利用 AI 生成违法、违规、有害的内容",
          "禁止侵权行为：不得利用 AI 生成侵犯他人知识产权的内容",
          "禁止欺骗行为：不得利用 AI 生成虚假信息进行欺骗或误导",
          "禁止商业滥用：未经许可，不得将 AI 服务用于商业牟利",
        ]} />
      </LegalSection>

      <LegalSection icon={<User size={18} />} title="4. 内容审核与数据使用" delay={0.2}>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">4.1 内容审核</h4>
        <LegalList items={[
          "您的 AI 对话内容可能经过自动审核以确保服务安全",
          "违规内容可能被系统拦截且不会得到回答",
          "严重违规行为可能导致账户被限制或封禁",
        ]} />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2 mt-4">4.2 数据使用</h4>
        <LegalList items={[
          "您的对话内容可能用于改善 AI 服务质量",
          "我们不会将您的对话内容用于训练对外开放的 AI 模型",
        ]} />
      </LegalSection>

      <LegalSection icon={<FileText size={18} />} title="5. 知识产权说明" delay={0.25}>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">5.1 AI 生成内容</h4>
        <LegalList items={[
          "AI 生成的内容的版权归您本人所有",
          "您需对使用 AI 生成内容的行为承担相应责任",
          '引用 AI 生成内容时请注明"由 AI 辅助生成"',
        ]} />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2 mt-4">5.2 服务本身</h4>
        <LegalList items={[
          "AI 服务的底层技术和模型归相应权利人所有",
          "未经授权，不得对 AI 服务进行逆向工程或滥用",
        ]} />
      </LegalSection>

      <LegalSection icon={<Clock size={18} />} title="6. 服务变更" delay={0.3}>
        <p>我们保留以下权利：</p>
        <LegalList numbered items={[
          "随时修改、暂停或终止 AI 服务的全部或部分功能",
          "调整 AI 服务的使用限制和配额",
          "更新或替换 AI 模型版本",
          "不对因服务变更造成的任何损失承担责任",
        ]} />
      </LegalSection>
    </LegalPage>
    );
}
