/**
 * 免责声明页面
 */

import { Shield, FileText, AlertTriangle, Scale, User, Server, Brain, Lock, Mail } from "lucide-react";
import {
  LegalPage,
  LegalSection,
  LegalAlert,
  LegalList,
  LegalGrid,
} from "~/components/legal/LegalPage";

export default function Disclaimer() {
  return (
    <LegalPage
      title="免责声明"
      subtitle="Disclaimer"
      date="最后更新：2026年4月8日"
      icon={<Shield size={24} />}
      secondaryLink={{ href: "/legal/privacy", text: "查看隐私政策" }}
    >
      <LegalSection icon={<FileText size={18} />} title="一、总则" delay={0.05}>
        <p>
          本网站是个人博客网站，旨在分享动漫，游戏，技术等内容。
          访问和使用本站即表示您同意接受本免责声明的所有条款。
        </p>
        <LegalAlert type="warning">
          如您不同意本声明的任何内容，请立即停止使用本站。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<FileText size={18} />} title="二、内容声明" delay={0.1}>
        <LegalGrid
          items={[
            { icon: "1", title: "个人观点", desc: "内容仅代表作者观点" },
            { icon: "2", title: "来源标注", desc: "版权问题联系我们处理" },
            { icon: "3", title: "信息准确性", desc: "不对内容准确性作保证" },
            { icon: "4", title: "第三方链接", desc: "不对第三方网站负责" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Scale size={18} />} title="三、版权说明" delay={0.15}>
        <LegalAlert type="info" title="原创内容">
          本站原创内容采用 <strong>CC BY-NC-SA 4.0</strong> 协议，版权归作者所有。
        </LegalAlert>
        <LegalAlert type="warning" title="素材使用" className="mt-3">
          动漫图片、角色等素材版权归原作者/版权方所有，仅作非商业性分享使用。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<User size={18} />} title="四、用户行为" delay={0.2}>
        <LegalList items={[
          "用户在本站发表的评论、留言等内容，其责任由用户自行承担",
          "禁止发布违法、侵权、淫秽、暴力、恶意攻击等不当内容",
          "本站有权在不通知的情况下删除违规内容，并保留追究法律责任的权利",
        ]} />
      </LegalSection>

      <LegalSection icon={<Server size={18} />} title="五、技术与服务" delay={0.25}>
        <LegalGrid
          items={[
            { icon: "1", title: "服务可用性", desc: "不保证服务不中断" },
            { icon: "2", title: "维护中断", desc: "可能因维护暂停" },
            { icon: "3", title: "Cookie", desc: "改善用户体验" },
          ]}
        />
      </LegalSection>

      <LegalSection icon={<Brain size={18} />} title="六、AI 功能与个性化推荐" delay={0.3}>
        <p>本站使用人工智能技术提供以下服务：</p>
        <LegalGrid
          items={[
            { icon: "1", title: "AI 聊天", desc: "智能对话助手" },
            { icon: "2", title: "内容生成", desc: "写作建议" },
            { icon: "3", title: "个性化", desc: "内容推荐" },
            { icon: "4", title: "智能搜索", desc: "快速检索" },
          ]}
        />
        <LegalAlert type="danger" title="AI 免责说明" className="mt-4">
          AI 生成的内容仅供参考，可能存在不准确信息。不应将 AI 内容作为专业建议的依据。
        </LegalAlert>
      </LegalSection>

      <LegalSection icon={<Lock size={18} />} title="七、隐私保护" delay={0.35}>
        <p>
          本站重视用户隐私保护，具体隐私政策请参阅
          <a href="/legal/privacy" className="text-primary-start hover:underline ml-1">《隐私政策》</a>页面。
        </p>
      </LegalSection>

      <LegalSection icon={<Scale size={18} />} title="八、法律适用与争议解决" delay={0.4}>
        <p>
          本声明的解释、执行及争议解决适用中华人民共和国法律。
          如因本站引起纠纷，双方应友好协商解决；协商不成的，任一方可向本站运营者所在地有管辖权的人民法院提起诉讼。
        </p>
      </LegalSection>

      <LegalSection icon={<AlertTriangle size={18} />} title="九、特别声明" delay={0.45}>
        <LegalAlert type="warning" title="免责声明范围">
          在法律允许的最大范围内本站及其运营者不对以下情况承担任何责任：
        </LegalAlert>
        <LegalList items={[
          "因使用或无法使用本站服务而造成的任何直接或间接损失",
          "因第三方行为导致的任何损害",
          "用户因自身原因造成的账号被盗、数据泄露等损失",
          "不可抗力因素造成的损失",
        ]} />
      </LegalSection>

      <LegalSection icon={<Mail size={18} />} title="十、联系我们" delay={0.5}>
        <p>如有疑问，请通过以下方式联系我们：</p>
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
