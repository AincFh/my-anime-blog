/**
 * Cookie 政策页面
 */

import { Cookie, Settings, Eye, Bell, Trash2 } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalTable,
} from "~/components/legal/LegalPage";

export default function CookiePolicyPage() {
    return (
    <LegalPage
      title="Cookie 政策"
      subtitle="Cookie Policy"
      date="最后更新：2026年4月8日"
      icon={<Cookie size={24} />}
      secondaryLink={{ href: "/legal/privacy", text: "查看隐私政策" }}
    >
      <LegalSection icon={<Cookie size={18} />} title="1. 什么是 Cookie" delay={0.05}>
        <p>
                                    Cookie 是您访问网站时，网站存储在您设备上的小型文本文件。
                                    它们帮助网站记住您的偏好设置、保持登录状态，并提供更好的用户体验。
                                </p>
      </LegalSection>

      <LegalSection icon={<Cookie size={18} />} title="2. Cookie 类型" delay={0.1}>
        <LegalAlert type="success" title="必要 Cookie（必须启用）">
          这些 Cookie 对于网站的基本功能至关重要，包括身份验证、安全保护和会话维持。
        </LegalAlert>
        <LegalAlert type="info" title="偏好 Cookie（可选）" className="mt-3">
          记住您的设置和偏好，如主题选择、语言设置等。
        </LegalAlert>
        <LegalAlert type="warning" title="分析 Cookie（可选）" className="mt-3">
          帮助我们了解访客如何与网站互动，用于改进服务质量。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Settings size={18} />} title="3. 如何管理 Cookie" delay={0.15}>
        <p>您可以通过以下方式管理 Cookie 偏好：</p>
        <LegalList numbered items={[
          "浏览器设置：阻止、删除或接受特定网站的 Cookie",
          "隐私设置：通过我们的弹窗选择接受哪些类型的 Cookie",
          "隐私浏览：使用浏览器的隐私浏览模式避免部分追踪",
        ]} />
        <LegalAlert type="warning" className="mt-4">
          禁用必要 Cookie 可能导致网站部分功能无法正常工作。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Eye size={18} />} title="4. Cookie 保留期限" delay={0.2}>
        <LegalTable
          headers={["Cookie 类型", "保留期限"]}
          rows={[
            { "Cookie 类型": "会话 Cookie", "保留期限": "关闭浏览器后自动删除" },
            { "Cookie 类型": "登录状态", "保留期限": "30 天" },
            { "Cookie 类型": "用户偏好", "保留期限": "1 年" },
            { "Cookie 类型": "安全相关", "保留期限": "会话结束或最多 24 小时" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Bell size={18} />} title="5. 第三方 Cookie" delay={0.25}>
        <p>我们使用的第三方服务可能设置自己的 Cookie：</p>
        <LegalList items={[
          "Cloudflare - 网站安全与性能",
          "Google Fonts - 字体加载",
          "分析服务 - 网站使用分析",
        ]} />
      </LegalSection>

      <LegalSection icon={<Trash2 size={18} />} title="6. 您的权利" delay={0.3}>
        <p>根据相关法律，您对您的个人信息（包括 Cookie 数据）拥有以下权利：</p>
        <LegalList numbered items={[
          "知情权：了解 Cookie 的使用目的",
          "选择权：选择接受或拒绝 Cookie",
          "删除权：请求删除您的 Cookie 数据",
          "投诉权：向监管部门投诉",
        ]} />
      </LegalSection>

      <LegalSection icon={<Settings size={18} />} title="7. 政策更新" delay={0.35}>
        <p>
          我们可能会不时更新本 Cookie 政策。任何更新将在此页面上发布，并更新页面顶部的日期。
          建议您定期查阅以了解最新信息。
        </p>
      </LegalSection>
    </LegalPage>
    );
}
