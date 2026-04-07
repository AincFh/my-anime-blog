---
name: markdown-render
description: 渲染 Markdown 文章内容，支持代码高亮、表格、任务列表、数学公式。用于将用户输入的 Markdown 转换为 HTML 并显示。
---

# Markdown 文章渲染

## 依赖安装

```bash
npm install marked highlight.js remark-math rehype-katex
npm install -D @types/marked
```

## 基础配置

### Marked 配置

```typescript
// app/utils/markdown.ts

import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 自定义渲染器
const renderer = new Renderer();

// 代码块渲染
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  
  return `
    <div class="code-block relative group">
      ${language !== 'plaintext' ? `<span class="code-lang absolute top-2 left-3 text-xs text-white/40">${language}</span>` : ''}
      <button 
        class="copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"
      >
        复制
      </button>
      <pre class="!mt-0 !rounded-lg"><code class="hljs language-${language}">${highlighted}</code></pre>
    </div>
  `;
};

// 行内代码
renderer.codespan = function({ text }: { text: string }) {
  return `<code class="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300 text-sm font-mono">${text}</code>`;
};

// 链接
renderer.link = function({ href, title, text }: { href: string; title?: string; text: string }) {
  const titleAttr = title ? ` title="${title}"` : '';
  const isExternal = href.startsWith('http');
  
  if (isExternal) {
    return `<a href="${href}"${titleAttr} class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
  
  return `<a href="${href}"${titleAttr} class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">${text}</a>`;
};

// 图片
renderer.image = function({ href, title, text }: { href: string; title?: string; text: string }) {
  const titleEl = title ? `<span class="block text-sm text-white/60 mt-2">${title}</span>` : '';
  return `
    <figure class="my-6">
      <img src="${href}" alt="${text}" class="rounded-lg max-w-full" loading="lazy" />
      ${titleEl}
    </figure>
  `;
};

// 表格
renderer.table = function({ header, rows }: { header: string; rows: string[][] }) {
  const headerCells = header
    .split('|')
    .filter(cell => cell.trim())
    .map(cell => `<th class="px-4 py-2 text-left border-b border-white/20">${cell.trim()}</th>`)
    .join('');
  
  const bodyRows = rows
    .map(row => `
      <tr>
        ${row
          .split('|')
          .filter(cell => cell.trim())
          .map(cell => `<td class="px-4 py-2 border-b border-white/10">${cell.trim()}</td>`)
          .join('')}
      </tr>
    `)
    .join('');
  
  return `
    <div class="overflow-x-auto my-6">
      <table class="w-full border-collapse">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
};

// 任务列表
renderer.listitem = function({ text, task, checked }: { text: string; task: boolean; checked?: boolean }) {
  if (task) {
    const checkedClass = checked ? 'bg-cyan-500' : 'bg-white/20';
    const textClass = checked ? 'line-through text-white/50' : '';
    return `
      <li class="flex items-start gap-3 my-2">
        <span class="flex-shrink-0 w-5 h-5 rounded border ${checkedClass} flex items-center justify-center mt-0.5">
          ${checked ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
        </span>
        <span class="${textClass}">${text}</span>
      </li>
    `;
  }
  return `<li class="my-2">${text}</li>`;
};

// 块引用
renderer.blockquote = function({ text }: { text: string }) {
  return `
    <blockquote class="border-l-4 border-cyan-500/50 pl-4 py-2 my-4 bg-white/5 rounded-r-lg text-white/80 italic">
      ${text}
    </blockquote>
  `;
};

// 标题
renderer.heading = function({ text, depth }: { text: string; depth: number }) {
  const sizes = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
  };
  
  const id = text.toLowerCase().replace(/[^\w]+/g, '-');
  
  return `
    <h${depth} id="${id}" class="font-bold ${sizes[depth as keyof typeof sizes]} mt-8 mb-4 text-white">
      <a href="#${id}" class="hover:text-cyan-400 transition-colors">${text}</a>
    </h${depth}>
  `;
};

// 分割线
renderer.hr = function() {
  return '<hr class="my-8 border-white/20" />';
};

// 强调
renderer.em = function({ text }: { text: string }) {
  return `<em class="text-purple-300">${text}</em>`;
};

// 粗体
renderer.strong = function({ text }: { text: string }) {
  return `<strong class="font-bold text-white">${text}</strong>`;
};

// 配置 marked
marked.use({
  renderer,
  gfm: true,
  breaks: true,
});

// 导出渲染函数
export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}
```

## React 组件封装

```typescript
// app/components/common/MarkdownRenderer.tsx

'use client';

import { useMemo } from 'react';
import { renderMarkdown } from '~/utils/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = useMemo(() => {
    return renderMarkdown(content);
  }, [content]);
  
  return (
    <article
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// 纯展示组件（SSR 兼容）
export function MarkdownContent({ content }: { content: string }) {
  return (
    <article className="markdown-body">
      {/* 服务器端预渲染的 HTML */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

## 样式配置

```css
/* app/styles/markdown.css */

/* 导入代码高亮主题 */
@import 'highlight.js/styles/atom-one-dark.css';

/* 导入数学公式样式 */
@import 'katex/dist/katex.min.css';

.markdown-body {
  @apply text-white/90 leading-relaxed;
  @apply font-sans;
}

/* 标题 */
.markdown-body h1 { @apply text-4xl font-bold mt-8 mb-4; }
.markdown-body h2 { @apply text-3xl font-bold mt-8 mb-4 border-b border-white/20 pb-2; }
.markdown-body h3 { @apply text-2xl font-bold mt-6 mb-3; }
.markdown-body h4 { @apply text-xl font-bold mt-4 mb-2; }
.markdown-body h5 { @apply text-lg font-bold mt-3 mb-2; }
.markdown-body h6 { @apply text-base font-bold mt-3 mb-2 text-white/70; }

/* 段落和行间距 */
.markdown-body p { @apply my-4; }
.markdown-body > p:first-child { @apply mt-0; }
.markdown-body > p:last-child { @apply mb-0; }

/* 链接 */
.markdown-body a {
  @apply text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors;
}

/* 列表 */
.markdown-body ul { @apply list-disc list-inside my-4 space-y-2; }
.markdown-body ol { @apply list-decimal list-inside my-4 space-y-2; }
.markdown-body li { @apply pl-2; }

/* 代码块 */
.markdown-body .code-block {
  @apply relative my-6 rounded-lg overflow-hidden;
  @apply bg-[#1a1b26] border border-white/10;
}

.markdown-body pre {
  @apply p-4 overflow-x-auto;
}

.markdown-body code {
  @apply font-mono text-sm;
}

/* 内联代码 */
.markdown-body p code,
.markdown-body li code {
  @apply px-1.5 py-0.5 bg-white/10 rounded text-cyan-300 text-sm;
}

/* 表格 */
.markdown-body table {
  @apply w-full my-6 border-collapse;
}

.markdown-body th,
.markdown-body td {
  @apply px-4 py-2 text-left border border-white/20;
}

.markdown-body th {
  @apply bg-white/5 font-semibold;
}

/* 引用块 */
.markdown-body blockquote {
  @apply border-l-4 border-cyan-500/50 pl-4 py-2 my-4 bg-white/5 rounded-r-lg;
}

/* 图片 */
.markdown-body img {
  @apply rounded-lg my-6 max-w-full;
}

/* 分割线 */
.markdown-body hr {
  @apply my-8 border-white/20;
}

/* 数学公式 */
.markdown-body .katex-display {
  @apply my-6 overflow-x-auto py-4;
}

.markdown-body .katex {
  @apply text-white/90;
}
```

## 安全考虑

### XSS 防护

```typescript
// 允许的 HTML 标签和属性
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'strong', 'em', 'del', 'sub', 'sup',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'input', // 用于任务列表
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'id',
      'type', 'checked', 'disabled',
      'target', 'rel',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

// 在渲染时使用
export function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return sanitizeHtml(html);
}
```

## 目录生成

```typescript
// 从 Markdown 内容提取目录
export function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
    
    toc.push({ level, text, id });
  }
  
  return toc;
}

interface TocItem {
  level: number;
  text: string;
  id: string;
}
```

## 使用示例

```tsx
// 页面中使用
import { MarkdownRenderer } from '~/components/common/MarkdownRenderer';
import { extractToc } from '~/utils/markdown';

export default function ArticlePage({ article }: { article: Article }) {
  const toc = useMemo(() => extractToc(article.content), [article.content]);
  
  return (
    <div className="grid grid-cols-4 gap-8">
      {/* 侧边栏 - 目录 */}
      <aside className="col-span-1">
        <nav className="sticky top-24">
          <h3 className="text-sm font-bold text-white/50 uppercase mb-4">目录</h3>
          <ul className="space-y-2">
            {toc.map((item, i) => (
              <li key={i} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                <a 
                  href={`#${item.id}`}
                  className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* 主内容 */}
      <article className="col-span-3">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">{article.title}</h1>
        </header>
        
        <MarkdownRenderer content={article.content} />
      </article>
    </div>
  );
}
```
