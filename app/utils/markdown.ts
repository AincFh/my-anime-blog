import { marked } from "marked";
import hljs from "highlight.js";

/**
 * Markdown渲染工具
 * 功能：
 * 1. 支持 :::spoiler 语法扩展
 * 2. 代码块语法高亮（使用 highlight.js）
 * 3. 自动语言检测
 */

// 自定义渲染器
const renderer = new marked.Renderer();

// 自定义代码块渲染 - 添加语法高亮
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  let highlighted: string;

  try {
    if (language === 'plaintext') {
      // 尝试自动检测语言
      const result = hljs.highlightAuto(text);
      highlighted = result.value;
    } else {
      highlighted = hljs.highlight(text, { language }).value;
    }
  } catch {
    highlighted = hljs.highlightAuto(text).value;
  }

  // 返回带有语言标签和复制按钮的代码块
  return `
    <div class="code-block-wrapper group relative">
      <div class="code-block-header">
        <span class="code-language">${language}</span>
        <button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').textContent).then(() => { this.textContent = '✓ 已复制'; setTimeout(() => this.textContent = '复制', 2000); })">
          复制
        </button>
      </div>
      <pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>
    </div>
  `;
};

// 自定义行内代码渲染
renderer.codespan = function ({ text }: { text: string }) {
  return `<code class="inline-code">${text}</code>`;
};

// 扩展marked配置以支持spoiler语法
export function renderMarkdown(content: string): string {
  // 先处理 :::spoiler[警告文字] 内容 :::
  const spoilerRegex = /:::spoiler(?:\[([^\]]+)\])?\s*([\s\S]*?):::/g;

  let processedContent = content.replace(spoilerRegex, (match, warning, innerContent) => {
    const warningText = warning || "剧透警告";
    // 转换为HTML，使用特殊标记以便前端组件处理
    return `<div data-spoiler data-warning="${warningText}">${innerContent.trim()}</div>`;
  });

  // 使用marked渲染Markdown
  const html = marked(processedContent, {
    breaks: true,
    gfm: true,
    renderer,
  }) as string;

  return html;
}

/**
 * 获取支持的编程语言列表（用于编辑器自动补全）
 */
export function getSupportedLanguages(): string[] {
  return hljs.listLanguages();
}

