import { forwardRef } from "react";

const POSTER_W = 750;
const POSTER_H = 1000;
const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

/* ========== 样式对象 ========== */

const containerStyle = {
  width: POSTER_W,
  height: POSTER_H,
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(165deg, #f5f0eb 0%, #eae4f0 40%, #dde4f0 100%)",
  fontFamily: FONT,
  color: "#3f4659",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "0 60px",
  boxSizing: "border-box"
};

const glowTopStyle = {
  position: "absolute",
  top: -80,
  right: -50,
  width: 300,
  height: 300,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(186,170,210,0.30) 0%, transparent 70%)",
  pointerEvents: "none"
};

const glowBottomStyle = {
  position: "absolute",
  bottom: -60,
  left: -40,
  width: 260,
  height: 260,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(170,195,220,0.25) 0%, transparent 70%)",
  pointerEvents: "none"
};

const brandStyle = {
  marginTop: 52,
  padding: "8px 20px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #6f84b7 0%, #a89cc8 100%)",
  color: "#fff",
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "0.06em"
};

const brandDividerStyle = {
  marginTop: 20,
  width: 40,
  height: 2,
  background: "rgba(111,132,183,0.3)",
  borderRadius: 1
};

const contextStyle = {
  marginTop: 24,
  fontSize: 22,
  color: "#8090b0",
  letterSpacing: "0.08em",
  fontWeight: 400
};

const pairingStyle = {
  marginTop: 16,
  fontSize: 48,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textAlign: "center",
  lineHeight: 1.3,
  color: "#2d3348"
};

const crossStyle = {
  display: "inline-block",
  margin: "0 16px",
  fontSize: 36,
  fontWeight: 400,
  color: "#a89cc8"
};

const tagStyle = {
  marginTop: 24,
  padding: "10px 28px",
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(190,204,236,0.4), rgba(199,188,219,0.4))",
  fontSize: 26,
  fontWeight: 600,
  color: "#4a5578",
  letterSpacing: "0.04em"
};

const dividerStyle = {
  marginTop: 36,
  width: "50%",
  height: 1,
  background: "rgba(111,132,183,0.18)"
};

const chemistryStyle = {
  marginTop: 36,
  fontSize: 24,
  lineHeight: 1.85,
  textAlign: "center",
  color: "#5e6580",
  fontStyle: "italic",
  padding: "0 16px",
  maxWidth: 600
};

const hintBoxStyle = {
  marginTop: 40,
  padding: "24px 36px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.55)",
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box"
};

const hintTitleStyle = {
  fontSize: 20,
  color: "#8090b0",
  letterSpacing: "0.04em",
  marginBottom: 10
};

const hintItemStyle = {
  fontSize: 18,
  color: "#9aa3c0",
  lineHeight: 1.8
};

const footerStyle = {
  marginTop: "auto",
  marginBottom: 44,
  textAlign: "center"
};

const footerQuestionStyle = {
  fontSize: 19,
  color: "#8090b0",
  letterSpacing: "0.03em",
  lineHeight: 1.7
};

const footerBrandStyle = {
  marginTop: 10,
  fontSize: 17,
  color: "#a89cc8",
  letterSpacing: "0.04em",
  fontWeight: 600
};

/* ========== 组件 ========== */

const CompatPosterCard = forwardRef(function CompatPosterCard(
  { myTitle, theirTitle, tag, chemistry, seriesTag },
  ref
) {
  // 从 tag 中分离 emoji 和标签文字（如 "🔥 共振型配对"）
  const tagText = tag || "";

  return (
    <div ref={ref} style={containerStyle}>
      {/* 装饰光晕 */}
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      {/* ① 品牌标签 */}
      <div style={brandStyle}>「{seriesTag}」</div>

      {/* 短横线装饰 */}
      <div style={brandDividerStyle} />

      {/* ② 语境文字 */}
      <div style={contextStyle}>相处指南</div>

      {/* ③ 配对类型名——视觉焦点 */}
      <div style={pairingStyle}>
        {myTitle}<span style={crossStyle}>×</span>{theirTitle}
      </div>

      {/* ④ 兼容性标签 */}
      <div style={tagStyle}>{tagText}</div>

      {/* ⑤ 分割线 */}
      <div style={dividerStyle} />

      {/* ⑥ Chemistry 一句话 */}
      <div style={chemistryStyle}>
        "{chemistry}"
      </div>

      {/* ⑦ 内容预告 */}
      <div style={hintBoxStyle}>
        <div style={hintTitleStyle}>完整报告包含</div>
        <div style={hintItemStyle}>关系画像 · 天然默契 · 潜在摩擦</div>
        <div style={hintItemStyle}>双方专属建议 · 相处锦囊 · 预警信号</div>
      </div>

      {/* ⑧ 底部落款 */}
      <div style={footerStyle}>
        <div style={footerQuestionStyle}>
          测一测你们的相处默契
        </div>
        <div style={footerBrandStyle}>—— {seriesTag}</div>
      </div>
    </div>
  );
});

export default CompatPosterCard;
