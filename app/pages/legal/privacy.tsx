/**
 * 隐私政策页面（简洁版）
 */

import { Shield, Database, Lock, UserCheck, RefreshCw, Mail } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
} from "~/components/legal/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="隐私政策"
      subtitle="Privacy Policy"
      date="生效日期：2025年12月7日"
      icon={<Shield size={24} />}
      secondaryLink={{ href: "/terms", text: "查看服务条款" }}
    >
      <LegalSection icon={<Database size={18} />} title="1. 引言" delay={0.05}>
        <p>
          我们非常重视您的隐私。本隐私政策旨在说明我们在您使用我们的网站和服务时如何收集、使用、存储和保护您的个人信息。
        </p>
      </LegalSection>

      <LegalSection icon={<Database size={18} />} title="2. 我们收集的信息" delay={0.1}>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">2.1 您主动提供的信息</h4>
        <LegalList items={[
          "账户信息：电子邮箱地址、用户名和密码",
          "用户内容：评论、文章、图片或其他内容",
          "通信记录：反馈、建议或咨询内容",
        ]} />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2 mt-4">2.2 自动收集的信息</h4>
        <LegalList items={[
          "设备信息：设备型号、操作系统、浏览器、IP 地址",
          "日志数据：访问时间、浏览页面、点击记录",
          "Cookies：维持登录状态、保存偏好设置",
        ]} />
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="3. 我们如何使用信息" delay={0.15}>
        <p>我们收集的信息主要用于以下目的：</p>
        <LegalList items={[
          "提供，维护和改进我们的服务",
          "处理注册、登录和身份验证",
          "向您发送服务通知、验证码或安全警报",
          "个性化您的用户体验",
          "监测和防止欺诈、滥用或安全漏洞",
          "遵守法律法规的要求",
        ]} />
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="4. 信息共享与披露" delay={0.2}>
        <LegalAlert type="success" title="我们承诺不会向第三方出售您的个人信息" />
        <p className="text-sm mt-4">我们仅在以下情况下共享您的信息：</p>
        <LegalList numbered items={[
          "服务提供商：云托管、邮件发送服务等，受保密协议约束",
          "法律要求：法律法规、法院命令或政府请求",
          "保护权益：保护我们、用户或公众的权利、财产或安全",
        ]} />
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="5. 数据安全" delay={0.25}>
        <LegalList items={[
          "使用 SSL/TLS 加密技术传输敏感数据",
          "对用户密码进行加盐哈希存储",
          "限制对个人信息的访问权限",
        ]} />
        <LegalAlert type="info" className="mt-4">
          尽管我们尽力保护您的信息，但请注意互联网传输并非绝对安全。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<UserCheck size={18} />} title="6. 您的权利" delay={0.3}>
        <p>根据适用法律，您可能拥有以下权利：</p>
        <LegalList items={[
          "访问、更正或更新您的个人信息",
          "删除您的账户及相关数据",
          "撤回您的同意（例如取消订阅邮件）",
        ]} />
        <p className="text-sm mt-4">
          您可以登录账户在设置页面进行操作，或通过联系我们行使这些权利。
        </p>
      </LegalSection>

      <LegalSection icon={<UserCheck size={18} />} title="7. 未成年人保护" delay={0.35}>
        <p>
          我们的服务主要面向成年人。如果您未满18岁，请在监护人的陪同下使用本服务。我们不会故意收集未成年人的个人信息。
        </p>
      </LegalSection>

      <LegalSection icon={<RefreshCw size={18} />} title="8. 隐私政策的变更" delay={0.4}>
        <p>
          我们可能会不时更新本隐私政策。变更后的政策将在本页面发布，并注明更新日期。
          对于重大变更，我们会通过邮件或网站公告通知您。
        </p>
      </LegalSection>

      <LegalSection icon={<Mail size={18} />} title="9. 联系我们" delay={0.45}>
        <p>如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
        <a
          href="mailto:mail@aincfh.dpdns.org"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-start/25 transition-all"
        >
          mail@aincfh.dpdns.org
        </a>
      </LegalSection>
    </LegalPage>
  );
}
