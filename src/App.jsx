import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import HomeScreen from "./components/HomeScreen";
import QuizScreen from "./components/QuizScreen";
import TransitionScreen from "./components/TransitionScreen";
import ResultScreen from "./components/ResultScreen";
import PosterCard from "./components/PosterCard";
import CompatPosterCard from "./components/CompatPosterCard";
import PosterModal from "./components/PosterModal";
import { questions } from "./data/questions";
import { resultContent } from "./data/results";
import { determineResult } from "./data/scoring";
import loadPosterFont from "./utils/loadPosterFont";
import { syncUnlockStatus } from "./utils/unlock";
import {
  trackHomeView,
  trackQuizStart,
  trackQuizAnswer,
  trackQuizComplete,
  trackResultView,
  trackShareCopy,
  trackRestart,
  trackInviteCopy,
  trackPosterGenerate,
  trackCompatPosterGenerate
} from "./utils/analytics";

const TOTAL_QUESTIONS = questions.length;
const AUTO_NEXT_DELAY = 220;
const TRANSITION_DURATION = 2500;
const SITE_URL = "https://tianxuanzhijiao.qzz.io";
const SERIES_TAG = "天选 · 知交卷";

// ---- 进度缓存 ----
const STORAGE_KEY_ANSWERS = "tx_quiz_answers";
const STORAGE_KEY_QUESTION = "tx_quiz_index";
const STORAGE_KEY_RESULT = "tx_quiz_result";

function saveProgress(answers, questionIndex) {
  try {
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
    localStorage.setItem(STORAGE_KEY_QUESTION, String(questionIndex));
  } catch { /* quota exceeded — 忽略 */ }
}

function saveResult(resultState) {
  try {
    localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify({
      resultKey: resultState.resultKey,
      secondaryKey: resultState.secondaryKey,
      scores: resultState.scores,
    }));
  } catch { /* 忽略 */ }
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY_ANSWERS);
  localStorage.removeItem(STORAGE_KEY_QUESTION);
  localStorage.removeItem(STORAGE_KEY_RESULT);
}

function loadSavedState() {
  try {
    // 优先恢复结果
    const savedResult = localStorage.getItem(STORAGE_KEY_RESULT);
    if (savedResult) {
      const parsed = JSON.parse(savedResult);
      if (parsed.resultKey && resultContent[parsed.resultKey]) {
        return {
          screen: "result",
          answers: null,
          questionIndex: 0,
          resultState: {
            resultKey: parsed.resultKey,
            secondaryKey: parsed.secondaryKey || null,
            scores: parsed.scores,
            content: resultContent[parsed.resultKey],
          },
        };
      }
    }
    // 其次恢复答题进度
    const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
    const savedIndex = localStorage.getItem(STORAGE_KEY_QUESTION);
    if (savedAnswers) {
      const answers = JSON.parse(savedAnswers);
      if (Array.isArray(answers) && answers.length === TOTAL_QUESTIONS) {
        const idx = Math.min(Math.max(0, Number(savedIndex) || 0), TOTAL_QUESTIONS - 1);
        return { screen: "quiz", answers, questionIndex: idx, resultState: null };
      }
    }
  } catch { /* 损坏数据 — 忽略 */ }
  return null;
}

function sanitizePosterFilenamePart(text) {
  return (text || "")
    .replace(/[「」【】]/g, "")
    .replace(/\s+/g, "-")
    .replace(/×/g, "-")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 将 canvas 转为 Blob URL（微信内置浏览器支持长按保存 Blob URL 图片，
 * 但不支持 data URI 图片的长按保存）。
 */
function canvasToBlobUrl(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}

function createPosterPreview({ imageUrl, posterKind, fileName, alt, hint }) {
  return {
    imageUrl,
    posterKind,
    fileName,
    alt,
    hint
  };
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      resolve();
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error);
    }
  });
}

function App() {
  const saved = loadSavedState();
  const [screen, setScreen] = useState(saved?.screen || "home");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(saved?.questionIndex || 0);
  const [answers, setAnswers] = useState(saved?.answers || Array(TOTAL_QUESTIONS).fill(""));
  const [resultState, setResultState] = useState(saved?.resultState || null);
  const [copied, setCopied] = useState(false);
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // 二次测试（帮 TA 测）相关状态
  const [isTestingTA, setIsTestingTA] = useState(false);
  const [myResultState, setMyResultState] = useState(null);
  const [taResultType, setTaResultType] = useState(null);

  // 读取 URL 中的 ?from= 参数（邀请链接携带的对方类型）
  const [inviteFrom] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("from") || null;
  });

  // 相处海报的数据（选中后传入）
  const [compatPosterData, setCompatPosterData] = useState(null);
  const [compatPosterLoading, setCompatPosterLoading] = useState(false);

  const autoNextTimerRef = useRef(null);
  const posterRef = useRef(null);
  const compatPosterRef = useRef(null);

  // 页面初始化：同步服务端解锁状态到 localStorage
  useEffect(() => {
    syncUnlockStatus().catch(() => {
      // 静默失败，降级使用本地缓存
    });
  }, []);

  // 首页曝光 & 结果页曝光
  useEffect(() => {
    if (screen === "home") {
      trackHomeView();
    }
    if (screen === "result" && resultState) {
      trackResultView(resultState.resultKey);
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "transition") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setScreen("result");
    }, TRANSITION_DURATION);

    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!inviteCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setInviteCopied(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [inviteCopied]);

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        window.clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = answers[currentQuestionIndex];

  function clearAutoNextTimer() {
    if (autoNextTimerRef.current) {
      window.clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }

  function startQuiz() {
    clearAutoNextTimer();
    trackQuizStart();
    clearProgress();
    setScreen("quiz");
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setResultState(null);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finalizeResult(nextAnswers) {
    clearAutoNextTimer();
    trackQuizComplete();
    const computed = determineResult(nextAnswers);
    const result = {
      ...computed,
      content: resultContent[computed.resultKey]
    };
    if (isTestingTA && myResultState) {
      // 如果是帮 TA 测，结束后回到原结果页
      setTaResultType(result.resultKey);
      setResultState(myResultState);
      setIsTestingTA(false);
      setMyResultState(null);
      setScreen("result");
    } else {
      setResultState(result);
      saveResult(result);
      setScreen("transition");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToQuestion(index) {
    clearAutoNextTimer();
    const safeIndex = Math.max(0, Math.min(index, TOTAL_QUESTIONS - 1));
    setCurrentQuestionIndex(safeIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    if (currentQuestionIndex === 0) return;
    goToQuestion(currentQuestionIndex - 1);
  }

  function handleSelect(option) {
    clearAutoNextTimer();
    trackQuizAnswer(currentQuestionIndex, option);

    setAnswers((prevAnswers) => {
      const nextAnswers = [...prevAnswers];
      nextAnswers[currentQuestionIndex] = option;

      // 缓存答题进度
      saveProgress(nextAnswers, currentQuestionIndex);

      autoNextTimerRef.current = window.setTimeout(() => {
        if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
          finalizeResult(nextAnswers);
        } else {
          goToQuestion(currentQuestionIndex + 1);
        }
      }, AUTO_NEXT_DELAY);

      return nextAnswers;
    });
  }

  function restart() {
    clearAutoNextTimer();
    trackRestart();
    clearProgress();
    setScreen("home");
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setResultState(null);
    setCopied(false);
    setInviteCopied(false);
    setPosterPreview(null);
    setPosterLoading(false);
    setCompatPosterData(null);
    setCompatPosterLoading(false);
    setIsTestingTA(false);
    setMyResultState(null);
    setTaResultType(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCopyShare() {
    if (!resultState?.content) {
      return;
    }

    const shareText = [
      `「${SERIES_TAG}」`,
      `${resultState.content.title}`,
      ``,
      `${resultState.content.share}`,
      ``,
      `🔗 来测测你的关系距离 → ${SITE_URL}`
    ].join("\n");

    try {
      await copyText(shareText);
      trackShareCopy(resultState?.resultKey);
      setCopied(true);
    } catch (error) {
      setCopied(false);
      window.alert("复制失败，请手动复制结果文案。");
    }
  }

  async function handleCopyInvite(text, myType, theirType) {
    try {
      await copyText(text);
      trackInviteCopy(myType, theirType);
      setInviteCopied(true);
    } catch (error) {
      setInviteCopied(false);
      window.alert("复制失败，请手动复制邀请文案。");
    }
  }

  async function handleGeneratePoster() {
    if (!posterRef.current || posterLoading) return;

    setPosterLoading(true);
    try {
      // 按需加载统一字体
      await loadPosterFont();

      // 等待一帧让字体渲染生效
      await new Promise((r) => requestAnimationFrame(r));

      // 等待字体完全就绪（包括排版刷新）
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        width: 750,
        height: 1000
      });

      const url = await canvasToBlobUrl(canvas);
      const resultTitle = sanitizePosterFilenamePart(resultState.content.title);

      trackPosterGenerate(resultState.resultKey);

      setPosterPreview(
        createPosterPreview({
          imageUrl: url,
          posterKind: "result",
          fileName: `${sanitizePosterFilenamePart(SERIES_TAG)}-${resultTitle}-结果海报.png`,
          alt: "你的关系风格海报",
          hint: "长按图片可保存到手机相册"
        })
      );
    } catch (error) {
      window.alert("海报生成失败，请重试。");
    } finally {
      setPosterLoading(false);
    }
  }

  async function handleGenerateCompatPoster(data) {
    // data: { myTitle, theirTitle, tag, chemistry, myTypeKey, theirTypeKey }
    setCompatPosterData(data);
    setCompatPosterLoading(true);

    try {
      await loadPosterFont();

      // 等两帧：一帧让 React 渲染 CompatPosterCard，一帧让字体生效
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      // 等待字体完全就绪（包括排版刷新）
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(compatPosterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        width: 750,
        height: 1000
      });

      const url = await canvasToBlobUrl(canvas);
      const myTitle = sanitizePosterFilenamePart(data.myTitle);
      const theirTitle = sanitizePosterFilenamePart(data.theirTitle);

      trackCompatPosterGenerate(data.myTypeKey, data.theirTypeKey);

      setPosterPreview(
        createPosterPreview({
          imageUrl: url,
          posterKind: "compat",
          fileName: `${sanitizePosterFilenamePart(SERIES_TAG)}-${myTitle}-${theirTitle}-相处海报.png`,
          alt: "相处指南海报",
          hint: "长按图片可保存到手机相册"
        })
      );
    } catch (error) {
      window.alert("海报生成失败，请重试。");
    } finally {
      setCompatPosterLoading(false);
    }
  }

  function handleRerunForTA() {
    // 1. 保存当前结果
    setMyResultState(resultState);
    // 2. 标记状态
    setIsTestingTA(true);
    setTaResultType(null);
    // 3. 重置并跳转
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setScreen("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {screen === "home" && <HomeScreen onStart={startQuiz} seriesTag={SERIES_TAG} inviteFrom={inviteFrom} />}

        {screen === "quiz" && (
          <QuizScreen
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS}
            selectedOption={selectedOption}
            onSelect={handleSelect}
            onPrev={goPrevious}
            canGoPrev={currentQuestionIndex > 0}
          />
        )}

        {screen === "transition" && (
          <TransitionScreen />
        )}

        {screen === "result" && resultState && (
          <ResultScreen
            result={resultState.content}
            scores={resultState.scores}
            copied={copied}
            onRestart={restart}
            onCopyShare={handleCopyShare}
            onGeneratePoster={handleGeneratePoster}
            posterLoading={posterLoading}
            seriesTag={SERIES_TAG}
            siteUrl={SITE_URL}
            resultKey={resultState.resultKey}
            secondaryKey={resultState.secondaryKey}
            onCopyInvite={handleCopyInvite}
            inviteCopied={inviteCopied}
            inviteFrom={taResultType || inviteFrom}
            onGenerateCompatPoster={handleGenerateCompatPoster}
            compatPosterLoading={compatPosterLoading}
            onRerunForTA={handleRerunForTA}
          />
        )}
      </main>

      {/* 隐藏的海报渲染区——不在可视区域内，仅供 html2canvas 截图 */}
      {screen === "result" && resultState && (
        <div className="poster-offscreen">
          <PosterCard
            ref={posterRef}
            result={resultState.content}
            scores={resultState.scores}
            seriesTag={SERIES_TAG}
            resultKey={resultState.resultKey}
            secondaryKey={resultState.secondaryKey}
            siteUrl={SITE_URL}
          />
        </div>
      )}

      {/* 隐藏的相处海报渲染区 */}
      {compatPosterData && (
        <div className="poster-offscreen">
          <CompatPosterCard
            ref={compatPosterRef}
            myTitle={compatPosterData.myTitle}
            theirTitle={compatPosterData.theirTitle}
            tag={compatPosterData.tag}
            chemistry={compatPosterData.chemistry}
            myTypeKey={compatPosterData.myTypeKey}
            siteUrl={SITE_URL}
            seriesTag={SERIES_TAG}
          />
        </div>
      )}

      {/* 海报预览弹窗 */}
      {posterPreview && (
        <PosterModal
          imageUrl={posterPreview.imageUrl}
          fileName={posterPreview.fileName}
          alt={posterPreview.alt}
          hint={posterPreview.hint}
          posterKind={posterPreview.posterKind}
          onClose={() => {
            if (posterPreview?.imageUrl) URL.revokeObjectURL(posterPreview.imageUrl);
            setPosterPreview(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
