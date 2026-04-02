import ProgressBar from "./ProgressBar";

function QuizScreen({
  question,
  questionIndex,
  totalQuestions,
  selectedOption,
  onSelect,
  onPrev,
  canGoPrev,
}) {
  return (
    <section className="screen fade-in">
      <div className="card quiz-card">
        <div className="quiz-meta">
          <span className="question-count">
            第 {questionIndex + 1} / {totalQuestions} 题
          </span>
          {canGoPrev ? (
            <button
              className="quiz-back-link"
              type="button"
              onClick={onPrev}
            >
              ← 上一题
            </button>
          ) : (
            <span className="question-hint">根据第一感觉就好</span>
          )}
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
    </section>
  );
}

export default QuizScreen;
