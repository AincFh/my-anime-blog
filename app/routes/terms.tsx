
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";

export default function TermsOfService() {
    return (
        <ResponsiveContainer maxWidth="lg" className="py-8 md:py-12">
            <div className="glass-card p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">服务条款</h1>

                <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-300">
                    <p className="text-sm text-slate-500">生效日期：2025年12月7日</p>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">1. 条款接受</h2>
                        <p>欢迎访问我们的网站。通过注册账户、访问或使用我们的服务，即表示您已阅读、理解并同意受本服务条款（以下简称“条款”）的约束。如果您不同意这些条款的任何部分，请立即停止使用本服务。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">2. 账户注册与安全</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>注册资格：</strong> 您必须年满18岁或在监护人同意下使用本服务。</li>
                            <li><strong>信息真实性：</strong> 您同意提供真实、准确、完整和最新的注册信息。</li>
                            <li><strong>账户安全：</strong> 您有责任维护账户密码的保密性，并对您账户下的所有活动负责。如发现未经授权的使用，请立即通知我们。</li>
                            <li><strong>账户归属：</strong> 账户仅限您本人使用，不得转让、借用或出售给他人。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">3. 用户行为规范</h2>
                        <p>您在使用本服务时必须遵守所有适用的法律法规，并同意不从事以下行为：</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>发布违反国家法律法规、危害国家安全、破坏社会稳定的内容。</li>
                            <li>发布淫秽、色情、暴力、赌博、恐怖或教唆犯罪的内容。</li>
                            <li>侮辱、诽谤、恐吓、骚扰他人，或侵犯他人隐私权、肖像权等合法权益。</li>
                            <li>发布垃圾广告、恶意软件、病毒或进行网络攻击。</li>
                            <li>冒充他人或机构，误导公众。</li>
                            <li>未经授权收集其他用户的信息。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">4. 知识产权</h2>
                        <h3 className="text-lg font-semibold mb-2">4.1 平台内容</h3>
                        <p>本网站及其包含的所有内容（包括但不限于文本、图片、音频、视频、软件、代码、商标、Logo等），除用户生成内容外，均归我们或相关权利人所有，受版权法、商标法等法律保护。未经许可，不得擅自使用。</p>

                        <h3 className="text-lg font-semibold mb-2 mt-4">4.2 用户生成内容</h3>
                        <p>您在平台上发布的内容（如评论、文章），版权归您所有。但通过发布内容，即表示您授予我们一项全球性的、免费的、非独家的许可，允许我们使用、复制、修改、改编、出版、翻译和展示该内容，用于运营和推广本服务。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">5. 违规处理</h2>
                        <p>如果我们发现或收到举报称您违反了本条款，我们有权视情节轻重采取以下措施：</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>删除或屏蔽违规内容。</li>
                            <li>警告、限制或暂停部分功能。</li>
                            <li>冻结或永久注销您的账户。</li>
                            <li>依法追究法律责任。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">6. 免责声明</h2>
                        <p>本服务按“现状”和“现有”基础提供，我们不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性或不侵权的保证。我们不保证服务不会中断、没有错误或绝对安全。在法律允许的最大范围内，我们不对因使用本服务产生的任何直接、间接、附带或后果性损害负责。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">7. 服务变更与终止</h2>
                        <p>我们保留随时修改、暂停或终止部分或全部服务的权利，且无需提前通知。我们不对因服务变更或终止对您造成的损失负责。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">8. 适用法律与争议解决</h2>
                        <p>本条款的解释和适用均受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；协商不成的，应提交至我们所在地有管辖权的人民法院诉讼解决。</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">9. 其他</h2>
                        <p>如果本条款的任何条款被认定为无效或不可执行，不影响其他条款的效力。我们未行使本条款下的任何权利不构成对该权利的放弃。</p>
                    </section>
                </div>
            </div>
        </ResponsiveContainer>
    );
}
