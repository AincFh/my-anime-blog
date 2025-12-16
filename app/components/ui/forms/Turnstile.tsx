import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile 验证码组件
 * 功能：替代reCAPTCHA，更快更隐私
 */
interface TurnstileProps {
  siteKey: string; // Cloudflare Turnstile Site Key
  onVerify: (token: string) => void;
  onError?: () => void;
}

export function Turnstile({ siteKey, onVerify, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 动态加载Turnstile脚本
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // 初始化Turnstile
      if (window.turnstile && containerRef.current) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token);
          },
          "error-callback": () => {
            if (onError) onError();
          },
        });
      }
    };

    return () => {
      // 清理
      if (window.turnstile && containerRef.current) {
        window.turnstile.remove(containerRef.current);
      }
    };
  }, [siteKey, onVerify, onError]);

  return <div ref={containerRef} className="turnstile-container" />;
}

// 扩展Window类型
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => void;
      remove: (container: HTMLElement) => void;
      reset: (container: HTMLElement) => void;
    };
  }
}

