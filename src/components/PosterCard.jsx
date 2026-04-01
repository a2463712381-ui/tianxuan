import { forwardRef } from "react";

const POSTER_W = 750;
const POSTER_H = 1000;
const MAX_SCORE = 20; // 每个维度的理论最高分（20题）

const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

const scoreLabels = {
  CN: "连接",
  SN: "稳定",
  BS: "边界",
  AS: "空间",
  DR: "共鸣"
};

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

/* —— 装饰光晕 —— */
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

/* —— 品牌标签 —— */
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

/* —— 品牌下方短横线 —— */
const brandDividerStyle = {
  marginTop: 20,
  width: 40,
  height: 2,
  background: "rgba(111,132,183,0.3)",
  borderRadius: 1
};

/* —— 语境文字："你的关系风格" —— */
const contextStyle = {
  marginTop: 20,
  fontSize: 22,
  color: "#8090b0",
  letterSpacing: "0.08em",
  fontWeight: 400
};

/* —— 结果名称（视觉焦点） —— */
const titleStyle = {
  marginTop: 12,
  fontSize: 56,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textAlign: "center",
  lineHeight: 1.2,
  color: "#2d3348"
};

/* —— 副标签 —— */
const subtitleStyle = {
  marginTop: 10,
  fontSize: 20,
  color: "#8090b0",
  letterSpacing: "0.04em",
  textAlign: "center",
  fontWeight: 400
};

/* —— 海报短句结论 —— */
const summaryStyle = {
  marginTop: 22,
  fontSize: 21,
  lineHeight: 1.9,
  textAlign: "center",
  color: "#6b7394",
  letterSpacing: "0.02em"
};

/* —— 维度数据区 —— */
const dataBlockStyle = {
  marginTop: 36,
  width: "100%",
  background: "rgba(255,255,255,0.55)",
  borderRadius: 20,
  padding: "28px 32px 24px",
  boxSizing: "border-box"
};

const dataLabelStyle = {
  fontSize: 16,
  color: "#8090b0",
  letterSpacing: "0.06em",
  textAlign: "center",
  marginBottom: 18
};

/* 主维度行 */
const primaryRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 16
};

const primaryNameStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#3f4659",
  minWidth: 52
};

const primaryBarBgStyle = {
  flex: 1,
  height: 16,
  borderRadius: 8,
  background: "rgba(111,132,183,0.12)",
  overflow: "hidden",
  position: "relative"
};

const primaryValueStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: "#6f84b7",
  minWidth: 28,
  textAlign: "right"
};

/* 次要维度行 */
const secondaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 6
};

const secondaryItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  flex: 1
};

const secondaryLabelStyle = {
  fontSize: 15,
  color: "#8090b0"
};

const secondaryBarBgStyle = {
  width: "100%",
  height: 6,
  borderRadius: 3,
  background: "rgba(111,132,183,0.10)",
  overflow: "hidden"
};

const secondaryValueStyle = {
  fontSize: 14,
  color: "#9aa3c0",
  fontWeight: 600
};

/* —— 分割线 —— */
const dividerStyle = {
  marginTop: 32,
  width: "50%",
  height: 1,
  background: "rgba(111,132,183,0.18)"
};

/* —— 金句 —— */
const quoteStyle = {
  marginTop: 28,
  fontSize: 22,
  lineHeight: 1.85,
  textAlign: "center",
  color: "#5e6580",
  fontStyle: "italic",
  padding: "0 16px",
  maxWidth: 600
};

/* —— 底部落款 —— */
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

const PosterCard = forwardRef(function PosterCard(
  { result, scores, seriesTag },
  ref
) {
  // 从 title 中提取【xxx】内的名称
  const shortTitle = result.title.replace(/^.*【/, "").replace(/】.*$/, "");

  // 从 share 字段中提取第一行作为金句
  const quoteText = result.share.split("\n")[0];

  // 找到主维度（得分最高）
  const sortedDims = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryKey, primaryValue] = sortedDims[0];
  const secondaryDims = sortedDims.slice(1);

  // 主维度渐变色条
  const primaryBarFillStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: `${Math.min((primaryValue / MAX_SCORE) * 100, 100)}%`,
    borderRadius: 8,
    background: "linear-gradient(90deg, #6f84b7 0%, #a89cc8 100%)"
  };

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
      <div style={contextStyle}>你的关系风格</div>

      {/* ③ 结果名称——视觉焦点 */}
      <div style={titleStyle}>{shortTitle}</div>

      {/* ③.5 副标签 */}
      {result.subtitle && (
        <div style={subtitleStyle}>{result.subtitle}</div>
      )}

      {/* ④ 海报专用短句 */}
      <div style={summaryStyle}>
        {(result.posterSummary || result.summary).split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </div>

      {/* ⑤ 维度数据区 */}
      <div style={dataBlockStyle}>
        <div style={dataLabelStyle}>你的核心关系需求</div>

        {/* 主维度：大字 + 渐变色条 */}
        <div style={primaryRowStyle}>
          <span style={primaryNameStyle}>{scoreLabels[primaryKey]}</span>
          <div style={primaryBarBgStyle}>
            <div style={primaryBarFillStyle} />
          </div>
          <span style={primaryValueStyle}>{primaryValue}</span>
        </div>

        {/* 次要维度：一排小色条 */}
        <div style={secondaryRowStyle}>
          {secondaryDims.map(([key, value]) => {
            const secondaryFillStyle = {
              height: "100%",
              width: `${Math.min((value / MAX_SCORE) * 100, 100)}%`,
              borderRadius: 3,
              background: "rgba(111,132,183,0.35)"
            };
            return (
              <div style={secondaryItemStyle} key={key}>
                <span style={secondaryLabelStyle}>{scoreLabels[key]}</span>
                <div style={secondaryBarBgStyle}>
                  <div style={secondaryFillStyle} />
                </div>
                <span style={secondaryValueStyle}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⑥ 分割线 */}
      <div style={dividerStyle} />

      {/* ⑦ 金句 */}
      <div style={quoteStyle}>"{quoteText}"</div>

      {/* ⑧ 底部落款 */}
      <div style={footerStyle}>
        <div style={footerQuestionStyle}>
          你在关系里最渴求的，又是什么？
        </div>
        <div style={footerBrandStyle}>—— {seriesTag}</div>
      </div>
    </div>
  );
});

export default PosterCard;
