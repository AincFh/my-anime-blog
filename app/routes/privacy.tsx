// PublicLayout is already provided by root.tsx
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";

export default function PrivacyPolicy() {
    return (
        <>
            <ResponsiveContainer maxWidth="lg" className="pt-8 pb-20">
                <div className="glass-card p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">隐私政策</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-300">
                        <p className="text-sm text-slate-500">生效日期：2025年12月7日</p>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">1. 引言</h2>
                            <p>我们非常重视您的隐私。本隐私政策旨在说明我们在您使用我们的网站和服务时如何收集、使用、存储和保护您的个人信息。请您在使用我们的服务前仔细阅读本政策。</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">2. 我们收集的信息</h2>
                            <h3 className="text-lg font-semibold mb-2">2.1 您主动提供的信息</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>账户信息：</strong> 当您注册账户时，我们需要收集您的电子邮箱地址、用户名和密码。</li>
                                <li><strong>用户内容：</strong> 您在网站上发布的评论、文章、图片或其他内容。</li>
                                <li><strong>通信记录：</strong> 您与我们联系时提供的反馈、建议或咨询内容。</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">2.2 自动收集的信息</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>设备信息：</strong> 包括您的设备型号、操作系统版本、浏览器类型、IP地址等。</li>
                                <li><strong>日志数据：</strong> 包括您的访问时间、浏览页面、点击记录等使用数据。</li>
                                <li><strong>Cookies 和类似技术：</strong> 我们使用 Cookies 来维持您的登录状态、保存偏好设置并分析网站流量。</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">3. 我们如何使用信息</h2>
                            <p>我们收集的信息主要用于以下目的：</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>提供、维护和改进我们的服务。</li>
                                <li>处理您的注册、登录和身份验证。</li>
                                <li>向您发送服务通知、验证码或安全警报。</li>
                                <li>个性化您的用户体验，例如推荐您可能感兴趣的内容。</li>
                                <li>监测和防止欺诈、滥用或安全漏洞。</li>
                                <li>遵守法律法规的要求。</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">4. 信息共享与披露</h2>
                            <p>我们承诺不会向第三方出售您的个人信息。我们仅在以下情况下共享您的信息：</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>服务提供商：</strong> 我们可能与协助我们运营网站的第三方服务商（如云托管、邮件发送服务）共享必要信息，但他们受保密协议约束。</li>
                                <li><strong>法律要求：</strong> 在法律法规要求、法院命令或政府请求的情况下，我们可能需要披露您的信息。</li>
                                <li><strong>保护权益：</strong> 为了保护我们、用户或公众的权利、财产或安全，我们可能在必要时披露信息。</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">5. 数据安全</h2>
                            <p>我们采取符合行业标准的安全措施来保护您的信息，包括：</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>使用 SSL/TLS 加密技术传输敏感数据。</li>
                                <li>对用户密码进行加盐哈希存储，确保即使数据库泄露也无法直接获取密码。</li>
                                <li>限制对个人信息的访问权限，仅限必要的工作人员访问。</li>
                            </ul>
                            <p className="mt-2">尽管我们尽力保护您的信息，但请注意互联网传输并非绝对安全，我们无法保证信息的绝对安全性。</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">6. 您的权利</h2>
                            <p>根据适用法律，您可能拥有以下权利：</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>访问、更正或更新您的个人信息。</li>
                                <li>删除您的账户及相关数据。</li>
                                <li>撤回您的同意（例如取消订阅邮件）。</li>
                            </ul>
                            <p>您可以登录账户在设置页面进行操作，或通过联系我们行使这些权利。</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">7. 未成年人保护</h2>
                            <p>我们的服务主要面向成年人。如果您未满18岁，请在监护人的陪同下使用本服务。我们不会故意收集未成年人的个人信息。</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">8. 隐私政策的变更</h2>
                            <p>我们可能会不时更新本隐私政策。变更后的政策将在本页面发布，并注明更新日期。对于重大变更，我们会通过邮件或网站公告通知您。</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">9. 联系我们</h2>
                            <p>如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
                            <p className="mt-2">电子邮箱：support@example.com</p>
                        </section>
                    </div>
                </div>
            </ResponsiveContainer>
        </>
    );
}
