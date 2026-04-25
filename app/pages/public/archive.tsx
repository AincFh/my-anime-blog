import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { OptimizedImage } from "~/components/ui/media/OptimizedImage";
import { FileText, Clapperboard, Clock, Sparkles } from "lucide-react";
import { getTimeline } from "~/services/timeline";
import type { TimelineItem } from "~/types/timeline";

export async function loader({ context }: LoaderFunctionArgs) {
    const env = context.cloudflare.env as { NOTION_TOKEN?: string; NOTION_TIMELINE_DATABASE_ID?: string; CACHE_KV?: import('@cloudflare/workers-types').KVNamespace };

    try {
        const result = await getTimeline(
            env.NOTION_TOKEN,
            env.NOTION_TIMELINE_DATABASE_ID,
            env.CACHE_KV
        );

        if (!result.success) {
            console.error('[Archive] Failed to fetch timeline:', result.error);
            return { items: [], groupedByYear: {} };
        }

        const items: TimelineItem[] = result.data;

        const groupedByYear = items.reduce((acc: Record<string, TimelineItem[]>, item) => {
            const date = new Date(item.date);
            const year = date.getFullYear().toString();
            if (!acc[year]) acc[year] = [];
            acc[year].push(item);
            return acc;
        }, {});

        return { items, groupedByYear };
    } catch (error) {
        console.error('[Archive] Failed to fetch:', error);
        return { items: [], groupedByYear: {} };
    }
}

const TYPE_ICONS: Record<string, React.ElementType> = {
    '网站里程碑': Sparkles,
    '功能上线': Sparkles,
    '界面调整': Sparkles,
    '修复记录': Sparkles,
    '开发随记': FileText,
};

const DEFAULT_ICON = Sparkles;

export default function Archive() {
    const loaderData = useLoaderData<typeof loader>();
    const { groupedByYear } = loaderData;
    const years = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef });

    // 视差效果
    const timelineY = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <div ref={containerRef} className="w-full max-w-[1600px] mx-auto pt-[70px] md:pt-[80px] pb-32 lg:pb-24 px-4 md:px-6 lg:px-10 xl:px-12">
            {/* 极简标题 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
            >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-sans font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    时光机
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">
                    时光卷轴的印记
                </p>
            </motion.div>

            {/* Apple 极简左置时轴 */}
            <div className="relative">
                {/* 浅灰轨道 */}
                <motion.div
                    style={{ y: timelineY }}
                    className="absolute left-[31px] md:left-[47px] top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"
                />

                <div className="relative z-10 flex flex-col gap-16 md:gap-24">
                    {years.map((year, yearIdx) => {
                        const yearItems = groupedByYear[year];
                        return (
                            <div key={year} className="relative">
                                {/* 年份节点头 */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: yearIdx * 0.1 }}
                                    className="flex items-center gap-6 md:gap-8 mb-8"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm z-10">
                                        <span className="text-xl md:text-3xl font-black tracking-tighter text-slate-800 dark:text-white">{year}</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/50" />
                                </motion.div>

                                {/* 这一年的记录群 */}
                                <div className="flex flex-col gap-8 md:gap-12 pl-[31px] md:pl-[47px]">
                                    {yearItems.map((item, idx) => {
                                        const Icon = TYPE_ICONS[item.type] || DEFAULT_ICON;
                                        const formattedDate = new Date(item.date).toLocaleDateString("zh-CN", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                        });

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className="relative pl-8 md:pl-16 group"
                                            >
                                                {/* 时轴连接点 */}
                                                <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-[3px] border-slate-300 dark:border-slate-600 group-hover:border-slate-800 dark:group-hover:border-white transition-colors duration-300 z-20" />

                                                {/* 主卡片 */}
                                                <div className="bg-white dark:bg-slate-900/40 rounded-2xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row p-4 md:p-6 gap-6">
                                                    {/* 配图区 */}
                                                    {item.cover && (
                                                        <div className="w-full md:w-64 shrink-0 aspect-video md:aspect-square rounded-xl md:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                                            <OptimizedImage
                                                                src={item.cover}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                                width={400}
                                                            />
                                                            <div className="absolute inset-0 bg-black/5" />
                                                        </div>
                                                    )}

                                                    {/* 内容介绍区 */}
                                                    <div className="flex-1 flex flex-col justify-center gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <Icon className="w-5 h-5 text-slate-400" />
                                                            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                                                                {formattedDate}
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                                            {item.title}
                                                        </h3>

                                                        {item.summary && (
                                                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl line-clamp-2">
                                                                {item.summary}
                                                            </p>
                                                        )}

                                                        {item.featured && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-start/10 text-primary-start border border-primary-start/20">
                                                                    首页展示
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {years.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 text-slate-400 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">记录为空</h3>
                    <p className="text-slate-500">时空的尽头，暂时没有任何波纹产生。</p>
                </div>
            )}
        </div>
    );
}
