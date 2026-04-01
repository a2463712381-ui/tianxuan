/**
 * 天选 · 数据埋点统一采集层
 *
 * 所有业务事件通过 track() 发出，底层适配具体平台。
 * 当前适配：Umami（通过全局 window.umami）
 * 切换平台时只需修改 send() 函数，业务代码无需改动。
 */

function send(eventName, data) {
  // —— Umami ——
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(eventName, data);
  }

  // —— 调试模式：开发环境下在控制台打印 ——
  if (import.meta.env.DEV) {
    console.log(`[analytics] ${eventName}`, data || "");
  }

  // 未来如需接入百度统计、GA4 等，在此处追加即可：
  // if (window._hmt) { window._hmt.push(["_trackEvent", ...]); }
  // if (window.gtag) { window.gtag("event", eventName, data); }
}

// ——————————————————————————————————————
// 业务事件
// ——————————————————————————————————————

/** 首页曝光 */
export function trackHomeView() {
  send("page_view_home");
}

/** 点击"开启测验" */
export function trackQuizStart() {
  send("quiz_start");
}

/** 作答一道题 */
export function trackQuizAnswer(questionIndex, option) {
  send("quiz_answer", {
    question: questionIndex + 1,
    option
  });
}

/** 完成全部题目 */
export function trackQuizComplete() {
  send("quiz_complete");
}

/** 查看结果页 */
export function trackResultView(resultKey) {
  send("result_view", { type: resultKey });
}

/** 复制分享文案 */
export function trackShareCopy(resultKey) {
  send("share_copy", { type: resultKey });
}

/** 点击重新测验 */
export function trackRestart() {
  send("quiz_restart");
}

/** 打开相处指南（点击入口） */
export function trackCompatibilityOpen(myType) {
  send("compatibility_open", { myType });
}

/** 选择对方类型查看指南 */
export function trackCompatibilitySelect(myType, theirType) {
  send("compatibility_select", { myType, theirType });
}

/** 复制邀请文案 */
export function trackInviteCopy(myType, theirType) {
  send("invite_copy", { myType, theirType });
}
