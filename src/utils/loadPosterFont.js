/**
 * 按需加载海报专用字体 Noto Sans SC（仅 400 + 700 权重）
 * 只在用户点击"生成海报"时调用，不影响页面正常加载速度。
 * 加载完成后字体会被浏览器缓存，后续调用几乎零延迟。
 */

const FONT_URL_400 =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&display=swap";
const FONT_URL_700 =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&display=swap";

let loaded = false;

export default async function loadPosterFont() {
  if (loaded) return;

  const link400 = document.createElement("link");
  link400.rel = "stylesheet";
  link400.href = FONT_URL_400;
  document.head.appendChild(link400);

  const link700 = document.createElement("link");
  link700.rel = "stylesheet";
  link700.href = FONT_URL_700;
  document.head.appendChild(link700);

  // 等待字体真正可用
  try {
    await document.fonts.load('400 16px "Noto Sans SC"');
    await document.fonts.load('700 16px "Noto Sans SC"');
  } catch {
    // 字体加载失败时静默降级，使用系统字体
  }

  loaded = true;
}
