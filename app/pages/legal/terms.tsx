/**
 * 服务条款页面
 */

import { FileText, UserPlus, Shield, Copyright, Scale, Mail } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalBadge,
} from "~/components/legal/LegalPage";

export default function TermsOfService() {
  return (
    <LegalPage
      title="服务条款"
      subtitle="Terms of Service"
      date="生效日期：2026年4月8日"
      icon={<FileText size={24} />}
      secondaryLink={{ href: "/legal/privacy", text: "查看隐私政策" }}
    >
      <LegalSection icon={<FileText size={18} />} title="1. 条款接受" delay={0.05}>
        <p>
          欢迎访问我们的网站。通过注册账户、访问或使用我们的服务，即表示您已阅读，理解并同意受本服务条款的约束。
        </p>
        <LegalAlert type="warning" title="提示">
          如果您不同意这些条款的任何部分，请立即停止使用本服务。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<UserPlus size={18} />} title="2. 账户注册与安全" delay={0.1}>
        <LegalList numbered items={[
          "注册资格：您必须年满18岁或在监护人同意下使用本服务",
          "信息真实性：您同意提供真实、准确、完整和最新的注册信息",
          "账户安全：您有责任维护账户密码的保密性，并对您账户下的所有活动负责",
          "账户归属：账户仅限您本人使用，不得转让、借用或出售给他人",
        ]} />
      </LegalSection>

      <LegalSection icon={<Shield size={18} />} title="3. 用户行为规范" delay={0.15}>
        <p>您在使用本服务时必须遵守所有适用的法律法规，并同意不从事以下行为：</p>
        <LegalList items={[
          "发布违法、危害国家安全的内容",
          "发布淫秽、暴力、赌博等内容",
          "侮辱、诽谤、骚扰他人",
          "发布垃圾广告或恶意软件",
          "冒充他人或机构",
          "未经授权收集用户信息",
        ]} />
      </LegalSection>

      <LegalSection icon={<Copyright size={18} />} title="4. 知识产权" delay={0.2}>
        <p>
          本网站及其包含的所有内容（文本、图片、音频、视频、软件、代码、商标、Logo等），除用户生成内容外，均归我们或相关权利人所有。
        </p>
        <p className="mt-3">
          您在平台上发布的内容版权归您所有。但通过发布内容，即表示您授予我们一项全球性的、免费的、非独家的许可，允许我们使用、复制、修改、出版和展示该内容。
        </p>
      </LegalSection>

      <LegalSection icon={<Scale size={18} />} title="5. 违规处理" delay={0.25}>
        <p>如果我们发现您违反了本条款，我们有权采取以下措施：</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { text: "删除违规内容", level: "low" },
            { text: "警告", level: "low" },
            { text: "限制功能", level: "medium" },
            { text: "暂停账户", level: "medium" },
            { text: "永久注销", level: "high" },
            { text: "追究法律责任", level: "high" },
          ].map((item, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                item.level === "low"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : item.level === "medium"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
              }`}
            >
              {item.text}
            </span>
          ))}
        </div>
      </LegalSection>

      <LegalSection icon={<Shield size={18} />} title="6. 免责声明" delay={0.3}>
        <LegalAlert type="warning" title="重要声明">
          本服务按"现状"提供，我们不作任何明示或暗示的保证。我们不保证服务不会中断、没有错误或绝对安全。
          在法律允许的最大范围内，我们不对因使用本服务产生的任何直接或间接损害负责。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<FileText size={18} />} title="7. 服务变更与终止" delay={0.35}>
        <p>
          我们保留随时修改、暂停或终止部分或全部服务的权利，且无需提前通知。
          我们不对因服务变更或终止对您造成的损失负责。
        </p>
      </LegalSection>

      <LegalSection icon={<Scale size={18} />} title="8. 适用法律与争议解决" delay={0.4}>
        <p>
          本条款的解释和适用均受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；
          协商不成的，应提交至我们所在地有管辖权的人民法院诉讼解决。
        </p>
      </LegalSection>

      <LegalSection icon={<Mail size={18} />} title="9. 联系我们" delay={0.45}>
        <p>如有任何问题，请通过以下方式联系我们：</p>
        <a
          href="mailto:mail@aincfh.dpdns.org"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-start/25 transition-all"
        >
          <Mail size={16} />
          mail@aincfh.dpdns.org
        </a>
      </LegalSection>
    </LegalPage>
  );
}
