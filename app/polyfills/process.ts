/**
 * Cloudflare Workers 环境下的 process polyfill
 * 用于解决 react-markdown 等依赖 node:process 的问题
 */

// 设置全局 process 对象
const processPolyfill = {
  env: {
    get NODE_ENV() {
      return "development";
    },
  },
  browser: true,
  versions: {
    node: "18.0.0",
  },
};

// 注入到全局
if (typeof globalThis !== "undefined") {
  (globalThis as any).process = processPolyfill;
}

export { processPolyfill as process };
export default processPolyfill;