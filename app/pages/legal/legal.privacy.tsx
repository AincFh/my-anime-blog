/**
 * 隐私政策页面
 */

import { Shield, Database, Lock, Cookie, UserCheck, Baby, RefreshCw, Mail } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalGrid,
} from "~/components/legal/LegalPage";

export default function PrivacyPolicyPage() {
    return (
    <LegalPage
      title="隐私政策"
      subtitle="Privacy Policy"
      date="最后更新：2026年4月8日"
      icon={<Shield size={24} />}
      secondaryLink={{ href: "/terms", text: "查看服务条款" }}
    >
      <LegalSection icon={<Database size={18} />} title="1. 信息收集" delay={0.05}>
        <p className="mb-4">我们收集以下类型的信息：</p>
        
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">您主动提供的信息</h4>
        <LegalList items={[
          "注册时提供的邮箱地址",
          "您设置的用户名和头像",
          "您发布的评论内容",
        ]} />
        
        <h4 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-2 mt-4">自动收集的信息</h4>
        <LegalList items={[
          "设备类型和浏览器信息",
          "IP 地址（用于安全保护）",
          "访问时间和浏览页面",
          "Cookie 和本地存储数据",
        ]} />
        
        <LegalAlert type="warning" title="支付信息">
          我们不存储银行卡号、支付密码等敏感支付信息。所有支付由第三方支付平台直接处理。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Database size={18} />} title="2. 信息使用" delay={0.1}>
        <p>我们将收集的信息用于：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "提供服务", desc: "提供和改进网站服务" },
            { icon: "2", title: "处理支付", desc: "处理会员订阅和支付" },
            { icon: "3", title: "发送通知", desc: "发送服务通知" },
            { icon: "4", title: "安全保障", desc: "保障账户安全" },
            { icon: "5", title: "数据分析", desc: "分析网站使用情况" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="3. 信息共享" delay={0.15}>
        <LegalAlert type="success" title="我们不会出售您的个人信息">
          以下情况可能涉及信息共享：
        </LegalAlert>
        <LegalList numbered items={[
          "支付处理：与支付平台共享必要的订单信息",
          "法律要求：响应法律程序或政府强制要求",
          "安全保护：防止欺诈或保护用户安全",
        ]} />
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="4. 数据安全" delay={0.2}>
        <p>我们采取以下措施保护您的数据：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "密码加密", desc: "PBKDF2 算法" },
            { icon: "2", title: "2FA 加密", desc: "AES-256" },
            { icon: "3", title: "传输加密", desc: "HTTPS" },
            { icon: "4", title: "安全审计", desc: "定期漏洞修复" },
            { icon: "5", title: "权限控制", desc: "访问严格控制" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Cookie size={18} />} title="5. Cookie 使用" delay={0.25}>
        <p>我们使用 Cookie 用于：</p>
        <LegalList items={[
          "保持登录状态",
          "记住您的偏好设置",
          "分析网站流量",
        ]} />
        <LegalAlert type="info">
          您可以在浏览器设置中禁用 Cookie，但可能影响部分功能。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<UserCheck size={18} />} title="6. 您的权利" delay={0.3}>
        <p>您对自己的数据拥有以下权利：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "访问权", desc: "查看您的个人信息" },
            { icon: "2", title: "更正权", desc: "更新不准确的信息" },
            { icon: "3", title: "删除权", desc: "请求删除账户和数据" },
            { icon: "4", title: "导出权", desc: "导出您的数据副本" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Baby size={18} />} title="7. 未成年人保护" delay={0.35}>
        <LegalAlert type="danger" title="年龄限制">
                                本网站不面向 <strong>16 周岁以下</strong>未成年人。如果您是未成年人家长，发现您的孩子未经同意向我们提供了信息，请联系我们删除。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<RefreshCw size={18} />} title="8. 政策更新" delay={0.4}>
                        <p>
                            我们可能不时更新本隐私政策。重大变更将通过网站公告或邮件通知您。
                            继续使用本网站即表示您接受更新后的政策。
                        </p>
      </LegalSection>

      <LegalSection icon={<Mail size={18} />} title="9. 联系我们" delay={0.45}>
        <p>如有隐私相关问题，请通过以下方式联系我们：</p>
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
