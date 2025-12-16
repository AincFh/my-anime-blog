import { PublicLayout } from "~/components/layout/PublicLayout";
import { ResponsiveContainer } from "~/components/ui/ResponsiveComponents";

export default function Articles() {
    return (
        <PublicLayout>
            <ResponsiveContainer maxWidth="lg" className="py-20">
                <div className="glass-card p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">文章列表</h1>
                    <p className="text-slate-600 dark:text-slate-300">这里是文章列表页，包含所有文章的列表展示。</p>
                </div>
            </ResponsiveContainer>
        </PublicLayout>
    );
}