import { forwardRef, useMemo } from "react";
import qrcode from "qrcode-generator";
import { DIMENSION_MAX_SCORES } from "../data/scoring";
import { resultContent } from "../data/results";

const POSTER_W = 750;
const POSTER_H = 1000;

const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

const scoreLabels = {
  CN: "连接",
  SN: "稳定",
  BS: "边界",
  AS: "空间",
  DR: "共鸣",
  GT: "信任"
};

const TYPE_VERSES = {
  companion: "愿我如星君如月，夜夜流光相皎洁。",
  steady: "桃李春风一杯酒，江湖夜雨十年灯。",
  boundary: "相看两不厌，只有敬亭山。",
  free: "行到水穷处，坐看云起时。",
  gentle: "细雨湿衣看不见，闲花落地听无声。",
  resonance: "身无彩凤双飞翼，心有灵犀一点通。"
};

/* ===== QR 码生成工具 ===== */

/**
 * 生成 QR 码的 PNG data-URI（Canvas 渲染，html2canvas 截图兼容）。
 * @param {string} text  - 要编码的 URL
 * @param {number} size  - 输出图片的像素尺寸（正方形）
 * @returns {string} data:image/png;base64,...
 */
function generateQrDataUri(text, size = 240) {
  const qr = qrcode(0, "M"); // 0 = auto type-number, M = 15% 容错
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;

  // 用离屏 canvas 绘制
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // 透明背景
  ctx.clearRect(0, 0, size, size);

  // 绘制深色模块（使用海报配色）
  ctx.fillStyle = "#3f4659";
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          Math.round(col * cellSize),
          Math.round(row * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }

  return canvas.toDataURL("image/png");
}

/**
 * 构建二维码链接。
 * 优先使用传入的 siteUrl；兜底 window.location.origin。
 */
function buildQrUrl(siteUrl, resultKey) {
  const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams({ from: "poster" });
  if (resultKey) params.set("result", resultKey);
  return `${base}?${params.toString()}`;
}

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

/* —— 诗句点睛 —— */
const verseStyle = {
  marginTop: 10,
  fontSize: 19,
  color: "#8a92b0",
  letterSpacing: "0.1em",
  textAlign: "center",
  fontStyle: "italic",
  fontWeight: 400
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

/* —— 隐性倾向 —— */
const secondaryHintStyle = {
  marginTop: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10
};

const secondaryLabelTagStyle = {
  fontSize: 14,
  color: "#a89cc8",
  letterSpacing: "0.06em",
  fontWeight: 500,
  padding: "4px 12px",
  background: "rgba(168,156,200,0.12)",
  borderRadius: 999
};

const secondaryTypeNameStyle = {
  fontSize: 18,
  color: "#8090b0",
  fontWeight: 600,
  letterSpacing: "0.04em"
};

/* —— 海报短句结论 —— */
const summaryStyle = {
  marginTop: 18,
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

/* —— 底部落款（左文右码 flex 布局） —— */
const footerStyle = {
  marginTop: "auto",
  marginBottom: 36,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20
};

/* 落款左侧：文案区 */
const footerLeftStyle = {
  flex: 1,
  minWidth: 0
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

/* 落款右侧：二维码区 */
const qrBlockStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flexShrink: 0,
  gap: 6
};

const qrImgStyle = {
  width: 80,
  height: 80,
  borderRadius: 6,
  background: "rgba(255,255,255,0.75)",
  padding: 4,
  boxSizing: "content-box"
};

const qrCaptionStyle = {
  fontSize: 11,
  color: "#9aa3c0",
  letterSpacing: "0.02em",
  textAlign: "center",
  whiteSpace: "nowrap"
};

/* ========== 组件 ========== */

const PosterCard = forwardRef(function PosterCard(
  { result, scores, seriesTag, resultKey, secondaryKey, siteUrl },
  ref
) {
  // 从 title 中提取【xxx】内的名称
  const shortTitle = result.title.replace(/^.*【/, "").replace(/】.*$/, "");

  // 隐性倾向名称
  const secondaryTitle = secondaryKey && secondaryKey !== resultKey
    ? (resultContent[secondaryKey]?.title?.match(/【(.+?)】/)?.[1] || "")
    : "";

  // 诗句
  const verse = TYPE_VERSES[resultKey] || "";

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
    width: `${Math.min((primaryValue / (DIMENSION_MAX_SCORES[primaryKey] || 20)) * 100, 100)}%`,
    borderRadius: 8,
    background: "linear-gradient(90deg, #6f84b7 0%, #a89cc8 100%)"
  };

  // 二维码 data URI（useMemo 避免每次 render 重复计算）
  const qrDataUri = useMemo(() => {
    const url = buildQrUrl(siteUrl, resultKey);
    return generateQrDataUri(url, 160);
  }, [siteUrl, resultKey]);

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

      {/* ③.5 诗句点睛 */}
      {verse && <div style={verseStyle}>{verse}</div>}

      {/* ③.6 副标签 */}
      {result.subtitle && (
        <div style={subtitleStyle}>{result.subtitle}</div>
      )}

      {/* ③.7 隐性倾向 */}
      {secondaryTitle && (
        <div style={secondaryHintStyle}>
          <span style={secondaryLabelTagStyle}>内隐倾向</span>
          <span style={secondaryTypeNameStyle}>{secondaryTitle}</span>
        </div>
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
              width: `${Math.min((value / (DIMENSION_MAX_SCORES[key] || 20)) * 100, 100)}%`,
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

      {/* ⑧ 底部落款：左文 + 右码 */}
      <div style={footerStyle}>
        <div style={footerLeftStyle}>
          <div style={footerQuestionStyle}>
            你在关系里最渴求的，又是什么？
          </div>
          <div style={footerBrandStyle}>—— {seriesTag}</div>
        </div>
        <div style={qrBlockStyle}>
          <img src={qrDataUri} style={qrImgStyle} alt="扫码进入知交卷" />
          <span style={qrCaptionStyle}>扫码测测你的关系画像</span>
        </div>
      </div>
    </div>
  );
});

export default PosterCard;
