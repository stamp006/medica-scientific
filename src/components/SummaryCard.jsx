import React from "react";

export default function SummaryCard({ summary }) {
  if (!summary) {
    return (
      <div className="card summary-card">
        <p className="empty-state">Summary unavailable for this scenario.</p>
      </div>
    );
  }

  const confidencePercent =
    typeof summary.confidence === "number"
      ? `${Math.round(summary.confidence * 100)}%`
      : "N/A";

  const timeWindow = summary.time_window
    ? `Day ${summary.time_window.start}-${summary.time_window.end}`
    : "N/A";

  return (
    <div className="card summary-card">
      <div>
        <p className="eyebrow">Primary Bottleneck</p>
        <h2>{summary.primary_bottleneck || "N/A"}</h2>
      </div>
      <div className="summary-grid">
        <div>
          <p className="label">Bottleneck Type</p>
          <p className="value">{summary.type || "N/A"}</p>
        </div>
        <div>
          <p className="label">Confidence</p>
          <p className="value">{confidencePercent}</p>
        </div>
        <div>
          <p className="label">Critical Window</p>
          <p className="value">{timeWindow}</p>
        </div>
      </div>
    </div>
  );
}
