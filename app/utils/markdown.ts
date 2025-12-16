import { marked } from "marked";

/**
 * Markdown渲染工具
 * 功能：支持 :::spoiler 语法扩展
 */

// 自定义渲染器：支持 :::spoiler 语法
const renderer = new marked.Renderer();

// 扩展marked配置以支持spoiler语法
export function renderMarkdown(content: string): string {
  // 先处理 :::spoiler[警告文字] 内容 :::
  const spoilerRegex = /:::spoiler(?:\[([^\]]+)\])?\s*([\s\S]*?):::/g;
  
  let processedContent = content.replace(spoilerRegex, (match, warning, content) => {
    const warningText = warning || "剧透警告";
    // 转换为HTML，使用特殊标记以便前端组件处理
    return `<div data-spoiler data-warning="${warningText}">${content.trim()}</div>`;
  });

  // 使用marked渲染Markdown
  const html = marked(processedContent, {
    breaks: true,
    gfm: true,
    renderer,
  }) as string;

  return html;
}

