import { a as reactExports } from "./worker-entry-CHMicv-3.js";
import "node:events";
import "node:stream";
function HiddenPixelButton() {
  reactExports.useEffect(() => {
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
      if (window.unlockAchievement) {
        window.unlockAchievement("pixel_hunter");
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
export {
  HiddenPixelButton
};
