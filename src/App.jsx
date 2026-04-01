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
import {
  trackHomeView,
  trackQuizStart,
  trackQuizAnswer,
  trackQuizComplete,
  trackResultView,
  trackShareCopy,
  trackRestart,
  trackInviteCopy
} from "./utils/analytics";

const TOTAL_QUESTIONS = questions.length;
const AUTO_NEXT_DELAY = 220;
const SITE_URL = "https://tianxuanzhijiao.qzz.io";
const SERIES_TAG = "天选 · 知交卷";

function sanitizePosterFilenamePart(text) {
  return (text || "")
    .replace(/[「」【】]/g, "")
    .replace(/\s+/g, "-")
    .replace(/×/g, "-")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  const [screen, setScreen] = useState("home");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL_QUESTIONS).fill(""));
  const [resultState, setResultState] = useState(null);
  const [copied, setCopied] = useState(false);
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // 读取 URL 中的 ?from= 参数（邀请链接携带的对方类型）
  const [inviteFrom, setInviteFrom] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("from") || null;
  });

  // 相处海报的数据（选中后传入）
  const [compatPosterData, setCompatPosterData] = useState(null);
  const [compatPosterLoading, setCompatPosterLoading] = useState(false);

  const autoNextTimerRef = useRef(null);
  const posterRef = useRef(null);
  const compatPosterRef = useRef(null);

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
    }, 1000);

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
    if (!inviteLinkCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setInviteLinkCopied(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [inviteLinkCopied]);

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
    setResultState({
      ...computed,
      content: resultContent[computed.resultKey]
    });
    setScreen("transition");
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

  function goNextManual() {
    if (!selectedOption) return;

    if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
      finalizeResult(answers);
      return;
    }

    goToQuestion(currentQuestionIndex + 1);
  }

  function handleSelect(option) {
    clearAutoNextTimer();
    trackQuizAnswer(currentQuestionIndex, option);

    setAnswers((prevAnswers) => {
      const nextAnswers = [...prevAnswers];
      nextAnswers[currentQuestionIndex] = option;

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
    setScreen("home");
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setResultState(null);
    setCopied(false);
    setInviteCopied(false);
    setInviteLinkCopied(false);
    setPosterPreview(null);
    setPosterLoading(false);
    setCompatPosterData(null);
    setCompatPosterLoading(false);
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
      trackShareCopy(resultState.resultKey);
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

  async function handleCopyInviteLink() {
    if (!resultState?.resultKey) return;
    const baseUrl = SITE_URL.split("?")[0];
    const link = `${baseUrl}?from=${resultState.resultKey}`;
    try {
      await copyText(link);
      setInviteLinkCopied(true);
    } catch (error) {
      setInviteLinkCopied(false);
      window.alert("复制失败，请手动复制链接。");
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

      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 750,
        height: 1000
      });

      const url = canvas.toDataURL("image/png");
      const resultTitle = sanitizePosterFilenamePart(resultState.content.title);
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
    // data: { myTitle, theirTitle, tag, chemistry }
    setCompatPosterData(data);
    setCompatPosterLoading(true);

    try {
      await loadPosterFont();

      // 等两帧：一帧让 React 渲染 CompatPosterCard，一帧让字体生效
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(compatPosterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 750,
        height: 1000
      });

      const url = canvas.toDataURL("image/png");
      const myTitle = sanitizePosterFilenamePart(data.myTitle);
      const theirTitle = sanitizePosterFilenamePart(data.theirTitle);
      setPosterPreview(
        createPosterPreview({
          imageUrl: url,
          posterKind: "compat",
          fileName: `${sanitizePosterFilenamePart(SERIES_TAG)}-${myTitle}-${theirTitle}-相处海报.png`,
          alt: "相处指南海报",
          hint: "长按图片可保存到手机相册。这是相处指南海报。"
        })
      );
    } catch (error) {
      window.alert("海报生成失败，请重试。");
    } finally {
      setCompatPosterLoading(false);
    }
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
            onNext={goNextManual}
            canGoPrev={currentQuestionIndex > 0}
            isLastQuestion={currentQuestionIndex === TOTAL_QUESTIONS - 1}
          />
        )}

        {screen === "transition" && (
          <TransitionScreen onReveal={() => setScreen("result")} />
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
            onCopyInvite={handleCopyInvite}
            inviteCopied={inviteCopied}
            inviteFrom={inviteFrom}
            onCopyInviteLink={handleCopyInviteLink}
            inviteLinkCopied={inviteLinkCopied}
            onGenerateCompatPoster={handleGenerateCompatPoster}
            compatPosterLoading={compatPosterLoading}
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
          onClose={() => setPosterPreview(null)}
        />
      )}
    </div>
  );
}

export default App;
