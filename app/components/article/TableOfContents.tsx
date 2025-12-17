import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
    const [headings, setHeadings] = useState<TOCItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        // 简单的正则提取标题
        // 注意：这只是一个简单的实现，更健壮的方式是使用 markdown 解析器的 AST
        const regex = /^(#{1,3})\s+(.+)$/gm;
        const items: TOCItem[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w\u4e00-\u9fa5-]/g, ""); // 保留中文、英文、数字、连字符

            items.push({ id, text, level });
        }

        setHeadings(items);
    }, [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "0px 0px -80% 0px" }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <div className="sticky top-24">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                目录
            </h4>
            <nav className="space-y-1 relative border-l border-white/10">
                {headings.map((heading) => (
                    <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block py-1 pl-4 text-sm transition-colors border-l-2 -ml-[2px] ${activeId === heading.id
                                ? "border-primary-start text-primary-start font-medium"
                                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-500/50"
                            }`}
                        style={{
                            paddingLeft: `${heading.level * 0.5 + 0.5}rem`,
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(heading.id)?.scrollIntoView({
                                behavior: "smooth",
                            });
                            setActiveId(heading.id);
                        }}
                    >
                        {heading.text}
                    </a>
                ))}
            </nav>
        </div>
    );
}
