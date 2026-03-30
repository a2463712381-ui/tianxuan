import { useEffect, useRef, useState } from "react";
import HomeScreen from "./components/HomeScreen";
import QuizScreen from "./components/QuizScreen";
import TransitionScreen from "./components/TransitionScreen";
import ResultScreen from "./components/ResultScreen";
import { questions } from "./data/questions";
import { resultContent } from "./data/results";
import { determineResult } from "./data/scoring";

const TOTAL_QUESTIONS = questions.length;
const AUTO_NEXT_DELAY = 220;

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

  const autoNextTimerRef = useRef(null);

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
    setScreen("quiz");
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setResultState(null);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finalizeResult(nextAnswers) {
    clearAutoNextTimer();
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
    setScreen("home");
    setCurrentQuestionIndex(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(""));
    setResultState(null);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCopyShare() {
    if (!resultState?.content) {
      return;
    }

    const shareText = `【${resultState.content.title}】\n${resultState.content.share}`;

    try {
      await copyText(shareText);
      setCopied(true);
    } catch (error) {
      setCopied(false);
      window.alert("复制失败，请手动复制结果文案。");
    }
  }

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {screen === "home" && <HomeScreen onStart={startQuiz} />}

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
          />
        )}
      </main>
    </div>
  );
}

export default App;