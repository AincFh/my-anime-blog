import { useEffect } from "react";

/**
 * 隐藏像素按钮
 * 功能：在Footer中放置1x1像素的隐藏按钮，点击解锁成就
 */
export function HiddenPixelButton() {
  useEffect(() => {
    // 在Footer中创建隐藏按钮
    const footer = document.querySelector("footer, [data-footer]");
    if (!footer) return;

    const button = document.createElement("button");
    button.style.width = "1px";
    button.style.height = "1px";
    button.style.position = "absolute";
    button.style.opacity = "0.01";
    button.style.cursor = "pointer";
    button.style.zIndex = "10";
    button.title = "像素猎人";
    
    button.addEventListener("click", () => {
      if ((window as any).unlockAchievement) {
        (window as any).unlockAchievement("pixel_hunter");
      }
      button.remove();
    });

    footer.style.position = "relative";
    footer.appendChild(button);

    return () => {
      button.remove();
    };
  }, []);

  return null;
}

