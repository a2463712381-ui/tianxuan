function ProgressBar({ value }) {
  const percentage = value <= 1 ? value * 100 : value;
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="progress-shell" aria-hidden="true">
      <div
        className="progress-fill"
        style={{ width: `${safePercentage}%` }}
      />
    </div>
  );
}

export default ProgressBar;