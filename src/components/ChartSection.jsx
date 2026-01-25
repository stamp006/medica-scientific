import React from "react";
import LineChart from "./LineChart.jsx";

export default function ChartSection({ charts }) {
  if (!charts) {
    return <p className="empty-state">No chart data available.</p>;
  }

  return (
    <div className="chart-grid">
      {charts.queue_levels && (
        <LineChart chartData={charts.queue_levels} title="Queue Levels" />
      )}
      {charts.process_output && (
        <LineChart chartData={charts.process_output} title="Process Output" />
      )}
      {charts.utilization && (
        <LineChart chartData={charts.utilization} title="Utilization" />
      )}
      {!charts.queue_levels && !charts.process_output && !charts.utilization && (
        <p className="empty-state">No charts available for this scenario.</p>
      )}
    </div>
  );
}
