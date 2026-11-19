export default function ProgressBar({ value, max, label, showValue = true }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const tone = percent > 80 ? "danger" : percent > 50 ? "warning" : "safe";

  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>

          {showValue && <b>{Math.round(percent)}%</b>}
        </div>
      )}

      <div className="progress-track">
        <div
          className={`progress-fill ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
