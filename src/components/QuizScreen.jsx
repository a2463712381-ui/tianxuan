import ProgressBar from "./ProgressBar";

function QuizScreen({
  question,
  questionIndex,
  totalQuestions,
  selectedOption,
  onSelect,
  onPrev,
  onNext,
  canGoPrev,
  isLastQuestion
}) {
  return (
    <section className="screen fade-in">
      <div className="card quiz-card">
        <div className="quiz-meta">
          <span className="question-count">
            第 {questionIndex + 1} / {totalQuestions} 题
          </span>
          <span className="question-hint">根据第一感觉就好</span>
        </div>

        <ProgressBar value={(questionIndex + 1) / totalQuestions} />

        <h2 className="question-title">{question.prompt}</h2>

        <div className="option-list">
          {Object.entries(question.options).map(([key, text]) => {
            const isActive = selectedOption === key;

            return (
              <button
                key={key}
                type="button"
                className={`option-card ${isActive ? "is-active" : ""}`}
                onClick={() => onSelect(key)}
              >
                <span className="option-label">{key}</span>
                <span className="option-text">{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="action-row action-row-inline">
        <button
          className="secondary-button"
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
        >
          上一题
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={onNext}
          disabled={!selectedOption}
        >
          {isLastQuestion ? "直接查看结果" : "下一题"}
        </button>
      </div>
    </section>
  );
}

export default QuizScreen;