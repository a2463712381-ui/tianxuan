import { forwardRef, useMemo } from "react";
import qrcode from "qrcode-generator";

const POSTER_W = 750;
const POSTER_H = 1000;
const FONT_SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const FONT_SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';

function generateQrDataUri(text, size = 240) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
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

function buildCompatQrUrl(siteUrl, myTypeKey) {
  const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams();
  if (myTypeKey) {
    params.set("from", myTypeKey);
  }
  return params.toString() ? `${base}?${params.toString()}` : base;
}

function splitPoemAndAuthor(text) {
  if (!text) {
    return { poem: "", author: "" };
  }

  const parts = text.split(/\s*——\s*/);
  if (parts.length < 2) {
    return { poem: text.trim(), author: "" };
  }

  return {
    poem: parts[0].trim(),
    author: parts.slice(1).join(" —— ").trim()
  };
}

const COMPACT_POEM_SET = new Set([
  "庭院深深深几许，杨柳堆烟，帘幕无重数。",
  "众里寻他千百度，蓦然回首，那人却在灯火阑珊处。"
]);

const SINGLE_LINE_POEM_SET = new Set([
  "庭院深深深几许，杨柳堆烟，帘幕无重数。"
]);

function getPoemTextStyle(poem) {
  const normalizedPoem = (poem || "").replace(/[“”]/g, "").trim();
  const isSingleLine = SINGLE_LINE_POEM_SET.has(normalizedPoem);

  if (COMPACT_POEM_SET.has(normalizedPoem)) {
    return {
      fontSize: 29,
      textAlign: isSingleLine ? "center" : "left",
      maxWidth: isSingleLine ? 640 : 560
    };
  }

  return {
    fontSize: 31,
    textAlign: "center",
    maxWidth: 590
  };
}

const containerStyle = {
  width: POSTER_W,
  height: POSTER_H,
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(165deg, #f5f0eb 0%, #eae4f0 40%, #dde4f0 100%)",
  fontFamily: FONT_SANS,
  color: "#3f4659",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "0 56px",
  boxSizing: "border-box"
};

const glowTopStyle = {
  position: "absolute",
  top: -80,
  right: -50,
  width: 300,
  height: 300,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(186, 170, 210, 0.30) 0%, transparent 70%)",
  pointerEvents: "none"
};

const glowBottomStyle = {
  position: "absolute",
  bottom: -60,
  left: -40,
  width: 260,
  height: 260,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(170, 195, 220, 0.25) 0%, transparent 70%)",
  pointerEvents: "none"
};

const headerStyle = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const brandStyle = {
  marginTop: 44,
  padding: "8px 20px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #6f84b7 0%, #a89cc8 100%)",
  color: "#fff",
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "0.08em"
};

const brandDividerStyle = {
  marginTop: 14,
  width: 48,
  height: 2,
  background: "rgba(111,132,183,0.25)",
  borderRadius: 1
};

const contextStyle = {
  marginTop: 14,
  fontSize: 21,
  color: "#8a92b0",
  letterSpacing: "0.12em",
  fontWeight: 400,
  textTransform: "uppercase"
};

const sloganStyle = {
  marginTop: 24,
  fontSize: 22,
  color: "#6f84b7",
  letterSpacing: "0.15em",
  fontFamily: FONT_SERIF,
  fontStyle: "italic",
  opacity: 0.85
};

const titleStyle = {
  marginTop: 12,
  fontSize: 48,
  fontWeight: 700,
  letterSpacing: "0.05em",
  lineHeight: 1.2,
  color: "#2d3348",
  textAlign: "center"
};

const crossStyle = {
  display: "inline-block",
  margin: "0 18px",
  fontSize: 34,
  fontWeight: 300,
  color: "#a89cc8",
  opacity: 0.7
};

const tagStyle = {
  marginTop: 20,
  padding: "10px 32px",
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(190,204,236,0.5), rgba(199,188,219,0.5))",
  fontSize: 24,
  fontWeight: 600,
  color: "#4a5578",
  letterSpacing: "0.06em",
  boxShadow: "0 2px 8px rgba(111,132,183,0.12)"
};

const poemSectionStyle = {
  position: "relative",
  marginTop: 22,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "0 20px"
};

const poemTextBaseStyle = {
  color: "#4a5269",
  fontFamily: FONT_SERIF,
  lineHeight: 1.85,
  letterSpacing: "0.06em",
  whiteSpace: "pre-wrap"
};

const poemAuthorStyle = {
  marginTop: 12,
  color: "rgba(110, 118, 141, 0.95)",
  fontFamily: FONT_SERIF,
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: "0.04em",
  alignSelf: "flex-end",
  paddingRight: 18
};

const interpretationBlockStyle = {
  marginTop: 18,
  padding: "0 40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10
};

function getInterpTextStyle(text) {
  const len = (text || "").length;
  // 超过 22 个字就开始进入紧凑模式
  let fontSize = 22;
  let maxWidth = 560;
  let letterSpacing = "0.05em";

  if (len > 22) {
    fontSize = 18;
    maxWidth = 670;
    letterSpacing = "0.02em";
  }
  if (len > 26) {
    fontSize = 17;
    maxWidth = 690;
    letterSpacing = "0.01em";
  }
  if (len > 28) {
    fontSize = 16.5;
    maxWidth = 710;
    letterSpacing = "0";
  }

  return {
    maxWidth,
    textAlign: "center",
    fontSize,
    lineHeight: 1.8,
    color: "#3f4659",
    letterSpacing,
    fontFamily: FONT_SERIF,
    fontWeight: 500,
    whiteSpace: "pre-wrap"
  };
}

function getChemTextStyle(text) {
  const rawText = text || "";
  const lines = rawText.split("\n");
  const maxLineLen = Math.max(...lines.map(l => l.length));
  // 如果手动换行了，按最长那行来判断是否需要缩小
  const effectiveLen = lines.length > 1 ? maxLineLen + 5 : rawText.length;

  let fontSize = 18;
  let maxWidth = 500;
  let letterSpacing = "0.03em";

  if (effectiveLen > 24) {
    fontSize = 17;
    maxWidth = 670;
    letterSpacing = "0.02em";
  }
  if (effectiveLen > 28) {
    fontSize = 16.5;
    maxWidth = 710;
    letterSpacing = "0.01em";
  }

  return {
    maxWidth,
    fontSize,
    lineHeight: 1.85,
    color: "#8a92b0",
    letterSpacing,
    margin: 0,
    width: "100%",
    textAlign: "center",
    fontStyle: "italic"
  };
}

const chemistryTextMainStyle = {
  display: "block",
  whiteSpace: "pre-wrap"
};

const hintBoxStyle = {
  marginTop: 24,
  padding: "24px 40px",
  borderRadius: 24,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.4)",
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
};

const hintTitleStyle = {
  fontSize: 19,
  color: "#6f84b7",
  letterSpacing: "0.06em",
  fontWeight: 600,
  marginBottom: 12
};

const hintItemStyle = {
  fontSize: 17,
  color: "#7a829a",
  lineHeight: 1.8,
  letterSpacing: "0.02em"
};

const footerStyle = {
  marginTop: "auto",
  marginBottom: 32,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px"
};

const footerLeadStyle = {
  flex: 1,
  minWidth: 0,
  textAlign: "left"
};

const footerQuestionStyle = {
  fontSize: 19,
  color: "#6f84b7",
  letterSpacing: "0.04em",
  lineHeight: 1.6,
  fontWeight: 500
};

const footerBrandStyle = {
  marginTop: 6,
  fontSize: 16,
  color: "#8a92b0",
  letterSpacing: "0.06em",
  fontWeight: 400
};

const qrBlockStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flexShrink: 0
};

const qrImgStyle = {
  width: 104,
  height: 104,
  borderRadius: 12,
  background: "#fff",
  padding: 8,
  boxSizing: "content-box",
  boxShadow: "0 4px 15px rgba(111,132,183,0.15)"
};

const qrCaptionStyle = {
  display: "none"
};

const CompatPosterCard = forwardRef(function CompatPosterCard(
  {
    myTitle,
    theirTitle,
    tag,
    poem,
    poeticChemistryShort,
    chemistry,
    seriesTag,
    siteUrl,
    myTypeKey
  },
  ref
) {
  const qrDataUri = useMemo(() => {
    const url = buildCompatQrUrl(siteUrl, myTypeKey);
    return generateQrDataUri(url, 160);
  }, [siteUrl, myTypeKey]);

  const tagText = tag || "";
  const { poem: rawPoem } = splitPoemAndAuthor(poem);
  const poemText = (rawPoem || "").replace(/[“”‘’"']/g, "").trim();
  const poemTextStyle = {
    ...poemTextBaseStyle,
    ...getPoemTextStyle(poemText)
  };

  const interpText = useMemo(() => {
    const text = poeticChemistryShort || "";
    if (text === "一座重重帘幕掩映的深院，等来了一位愿意耐心驻足的寻访者。") {
      return "一座重重帘幕掩映的深院，\n等来了一位愿意耐心驻足的寻访者。";
    }
    // “轻盈的云影...” 保持原样即为一行，但在 interpretationTextStyle 中已确保宽容器
    return text;
  }, [poeticChemistryShort]);

  const finalChemistry = useMemo(() => {
    const text = chemistry || "";
    if (text === "一个不愿被定义，一个不敢轻易交付真心——靠近从来不是没有代价的。") {
      return "一个不愿被定义，一个不敢轻易交付真心。\n靠近从来不是没有代价的。";
    }
    return text;
  }, [chemistry]);

  return (
    <div ref={ref} style={containerStyle}>
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      <div style={headerStyle}>
        <div style={brandStyle}>「{seriesTag}」</div>
        <div style={brandDividerStyle} />
        <div style={contextStyle}>相处指南</div>
        <div style={sloganStyle}>两种节奏，一种看见</div>
        <div style={titleStyle}>
          {myTitle}
          <span style={crossStyle}>×</span>
          {theirTitle}
        </div>
        <div style={tagStyle}>{tagText}</div>
      </div>

      <div style={poemSectionStyle}>
        {poemText ? <div style={poemTextStyle}>{poemText}</div> : null}
      </div>

      <div style={interpretationBlockStyle}>
        <div style={getInterpTextStyle(interpText)}>{interpText}</div>
        <div style={getChemTextStyle(finalChemistry)}>
          <span style={chemistryTextMainStyle}>{finalChemistry}</span>
        </div>
      </div>

      <div style={hintBoxStyle}>
        <div style={hintTitleStyle}>完整报告包含</div>
        <div style={hintItemStyle}>关系画像 · 天然默契 · 潜在摩擦</div>
        <div style={hintItemStyle}>双方专属建议 · 相处锦囊 · 预警信号</div>
      </div>

      <div style={footerStyle}>
        <div style={footerLeadStyle}>
          <div style={footerQuestionStyle}>扫描右侧二维码 解锁深层看见</div>
          <div style={footerBrandStyle}>—— {seriesTag} 系列测试</div>
        </div>
        <div style={qrBlockStyle}>
          <img src={qrDataUri} style={qrImgStyle} alt="扫码进入相处指南" />
        </div>
      </div>
    </div>
  );
});

export default CompatPosterCard;
