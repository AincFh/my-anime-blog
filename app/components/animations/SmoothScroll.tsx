import { useEffect } from 'react';

/**
 * 平滑滚动组件（使用虚拟滚动库 Lenis）
 * 实现白皮书要求的"平滑滚动体验"
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 使用 CSS 实现平滑滚动（原生方案，无需额外依赖）
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // 如果未来需要更高级的虚拟滚动，可以集成 Lenis
    // import Lenis from '@studio-freight/lenis';
    // const lenis = new Lenis();
    // function raf(time: number) {
    //   lenis.raf(time);
    //   requestAnimationFrame(raf);
    // }
    // requestAnimationFrame(raf);
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return <>{children}</>;
}

