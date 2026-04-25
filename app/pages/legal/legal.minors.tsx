/**
 * 未成年人保护条款页面
 */

import { Baby, Shield, BookOpen, Users, AlertTriangle, Phone } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalGrid,
} from "~/components/legal/LegalPage";

export default function MinorProtectionPage() {
  return (
    <LegalPage
      title="未成年人保护条款"
      subtitle="Minor Protection Policy"
      date="最后更新：2026年4月8日"
      icon={<Baby size={24} />}
      secondaryLink={{ href: "/legal/privacy", text: "查看隐私政策" }}
    >
      <LegalSection icon={<AlertTriangle size={18} />} title="1. 年龄限制声明" delay={0.05}>
        <LegalAlert type="danger" title="年龄要求">
          <strong>本服务不面向 16 周岁以下</strong>的未成年人。如果您未满 16 周岁，请勿注册账户或使用本服务。
        </LegalAlert>
        <LegalAlert type="warning" title="监护人须知" className="mt-3">
          如果您是 16-18 周岁未成年人的监护人，请了解您的孩子需要监护人的同意才能注册账户。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Shield size={18} />} title="2. 个人信息保护" delay={0.1}>
        <p>我们承诺对未成年人个人信息进行特殊保护：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "最小化收集", desc: "仅收集必需信息" },
            { icon: "2", title: "明确目的", desc: "告知用途" },
            { icon: "3", title: "有限保留", desc: "必要期限内保留" },
            { icon: "4", title: "加强保护", desc: "更严格安全措施" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<BookOpen size={18} />} title="3. 内容规范" delay={0.15}>
        <p>我们致力于为用户提供健康、安全的网络环境：</p>
        <LegalList items={[
          "我们不会展示任何色情、暴力、赌博等内容",
          "我们不会向用户推送任何形式的广告",
          "我们不会利用算法诱导用户沉迷使用",
          "我们提供健康的内容推荐和积极的价值引导",
        ]} />
      </LegalSection>

      <LegalSection icon={<Users size={18} />} title="4. 监护人权利" delay={0.2}>
        <p>作为监护人，您拥有以下权利：</p>
        <LegalGrid
          columns={3}
          items={[
            { icon: "1", title: "知情权", desc: "了解信息收集" },
            { icon: "2", title: "同意权", desc: "同意注册" },
            { icon: "3", title: "访问权", desc: "了解账户活动" },
            { icon: "4", title: "删除权", desc: "要求删除信息" },
            { icon: "5", title: "拒绝权", desc: "拒绝收集" },
            { icon: "6", title: "投诉权", desc: "向监管部门" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<AlertTriangle size={18} />} title="5. 违规内容举报" delay={0.25}>
        <p>如果您发现以下情况，请立即举报：</p>
        <LegalList items={[
          "发现针对未成年人的不当内容或行为",
          "发现有人试图联系您的孩子",
          "发现违反本政策的行为",
          "您的孩子账户被盗用",
        ]} />
        <LegalAlert type="danger" title="紧急情况" className="mt-4">
          如果您的孩子面临紧急危险，请立即拨打 110 报警。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Phone size={18} />} title="6. 联系方式" delay={0.3}>
        <p>如有关于未成年人保护的问题，请联系我们：</p>
        <a
          href="mailto:mail@aincfh.dpdns.org"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-start/25 transition-all"
        >
          mail@aincfh.dpdns.org
        </a>
        <LegalAlert type="info" className="mt-4">
          我们将在收到您的联系请求后 <strong>3 个工作日内</strong> 给予回复。
        </LegalAlert>
      </LegalSection>
    </LegalPage>
  );
}
