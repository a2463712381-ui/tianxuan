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

function getPoemTextStyle(poem) {
  const normalizedPoem = (poem || "").replace(/[“”]/g, "").trim();
  if (COMPACT_POEM_SET.has(normalizedPoem)) {
    return {
      fontSize: 29,
      textAlign: "left",
      maxWidth: 560
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
  padding: "8px 18px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #6f84b7 0%, #a89cc8 100%)",
  color: "#fff",
  fontSize: 19,
  fontWeight: 600,
  letterSpacing: "0.06em"
};

const brandDividerStyle = {
  marginTop: 16,
  width: 40,
  height: 2,
  background: "rgba(111,132,183,0.3)",
  borderRadius: 1
};

const contextStyle = {
  marginTop: 18,
  fontSize: 20,
  color: "#8090b0",
  letterSpacing: "0.08em",
  fontWeight: 400
};

const titleStyle = {
  marginTop: 14,
  fontSize: 44,
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: 1.24,
  color: "#2d3348",
  textAlign: "center"
};

const crossStyle = {
  display: "inline-block",
  margin: "0 14px",
  fontSize: 32,
  fontWeight: 400,
  color: "#a89cc8"
};

const tagStyle = {
  marginTop: 24,
  padding: "10px 28px",
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(190,204,236,0.45), rgba(199,188,219,0.45))",
  fontSize: 23,
  fontWeight: 600,
  color: "#4a5578",
  letterSpacing: "0.04em"
};

const poemSectionStyle = {
  position: "relative",
  marginTop: 32,
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const poemLineStyle = {
  width: "50%",
  height: 1,
  background: "rgba(111,132,183,0.18)",
  marginBottom: 24
};

const poemTextBaseStyle = {
  color: "#4a5269",
  fontFamily: FONT_SERIF,
  lineHeight: 1.82,
  letterSpacing: "0.05em",
  whiteSpace: "pre-wrap"
};

const poemAuthorStyle = {
  marginTop: 16,
  color: "rgba(110, 118, 141, 0.95)",
  fontFamily: FONT_SERIF,
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: "0.04em",
  alignSelf: "flex-end",
  paddingRight: 18
};

const interpretationBlockStyle = {
  marginTop: 52,
  padding: "0 12px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  minHeight: 80
};

const interpretationTextStyle = {
  maxWidth: 590,
  textAlign: "center",
  fontSize: 18,
  lineHeight: 1.6,
  color: "#6e7798",
  letterSpacing: "0.02em"
};

const chemistryInlineStyle = {
  maxWidth: 540,
  fontSize: 18,
  lineHeight: 1.6,
  color: "#6e7798",
  letterSpacing: "0.02em",
  margin: 0,
  width: "100%",
  textAlign: "center"
};

const chemistryTextMainStyle = {
  display: "block"
};

const hintBoxStyle = {
  marginTop: 56,
  padding: "20px 32px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.75)",
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box"
};

const hintTitleStyle = {
  fontSize: 18,
  color: "#6c7ba3",
  letterSpacing: "0.04em",
  marginBottom: 8
};

const hintItemStyle = {
  fontSize: 16,
  color: "#74819f",
  lineHeight: 1.7
};

const footerStyle = {
  marginTop: "auto",
  marginBottom: 28,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20
};

const footerLeadStyle = {
  flex: 1,
  minWidth: 0,
  textAlign: "center"
};

const footerQuestionStyle = {
  fontSize: 17,
  color: "#6f7ea5",
  letterSpacing: "0.03em",
  lineHeight: 1.7
};

const footerBrandStyle = {
  marginTop: 8,
  fontSize: 15,
  color: "#8f84b3",
  letterSpacing: "0.04em",
  fontWeight: 600
};

const qrBlockStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flexShrink: 0,
  gap: 6
};

const qrImgStyle = {
  width: 88,
  height: 88,
  borderRadius: 6,
  background: "rgba(255,255,255,0.75)",
  padding: 4,
  boxSizing: "content-box"
};

const qrCaptionStyle = {
  fontSize: 11,
  color: "#7f8cab",
  letterSpacing: "0.02em",
  textAlign: "center",
  whiteSpace: "nowrap"
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
  const { poem: poemText } = splitPoemAndAuthor(poem);
  const poemTextStyle = {
    ...poemTextBaseStyle,
    ...getPoemTextStyle(poemText)
  };

  return (
    <div ref={ref} style={containerStyle}>
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      <div style={headerStyle}>
        <div style={brandStyle}>「{seriesTag}」</div>
        <div style={brandDividerStyle} />
        <div style={contextStyle}>相处指南</div>
        <div style={titleStyle}>
          {myTitle}
          <span style={crossStyle}>×</span>
          {theirTitle}
        </div>
        <div style={tagStyle}>{tagText}</div>
      </div>

      <div style={poemSectionStyle}>
        <div style={poemLineStyle} />
        {poemText ? <div style={poemTextStyle}>{poemText}</div> : null}
      </div>

      <div style={interpretationBlockStyle}>
        <div style={interpretationTextStyle}>{poeticChemistryShort}</div>
        <div style={chemistryInlineStyle}>
          <span style={chemistryTextMainStyle}>{chemistry}</span>
        </div>
      </div>

      <div style={hintBoxStyle}>
        <div style={hintTitleStyle}>完整报告包含</div>
        <div style={hintItemStyle}>关系画像 · 天然默契 · 潜在摩擦</div>
        <div style={hintItemStyle}>双方专属建议 · 相处锦囊 · 预警信号</div>
      </div>

      <div style={footerStyle}>
        <div style={footerLeadStyle}>
          <div style={footerQuestionStyle}>扫码测测你们的相处默契</div>
          <div style={footerBrandStyle}>—— {seriesTag}</div>
        </div>
        <div style={qrBlockStyle}>
          <img src={qrDataUri} style={qrImgStyle} alt="扫码进入相处指南" />
          <span style={qrCaptionStyle}>扫码测测你们的相处默契</span>
        </div>
      </div>
    </div>
  );
});

export default CompatPosterCard;
