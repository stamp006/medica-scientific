import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const mutedPalette = [
  "#2f7e7b",
  "#d29b2e",
  "#2f3b4d",
  "#6a8f3e",
  "#b76e3f",
  "#4b6f82",
];

export default function LineChart({ chartData, title, subtitle }) {
  if (!chartData || !chartData.labels || !chartData.series) {
    return <p className="empty-state">No data available for {title}.</p>;
  }

  const datasets = chartData.series.map((series, index) => {
    const isHighlight = Boolean(series.highlight);
    const color = isHighlight ? "#d1493f" : mutedPalette[index % mutedPalette.length];
    const backgroundColor = isHighlight
      ? "rgba(209, 73, 63, 0.15)"
      : "rgba(47, 59, 77, 0.1)";

    return {
      label: series.name,
      data: series.values,
      borderColor: color,
      backgroundColor,
      borderWidth: isHighlight ? 3 : 1.5,
      pointRadius: isHighlight ? 2 : 0,
      pointHoverRadius: 4,
      tension: 0.35,
      fill: false,
    };
  });

  const data = {
    labels: chartData.labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, padding: 16 },
      },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: true, text: "Day" },
        grid: { color: "rgba(15, 23, 42, 0.08)" },
      },
      y: {
        title: { display: true, text: "Value" },
        grid: { color: "rgba(15, 23, 42, 0.08)" },
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        <p className="chart-subtitle">
          {subtitle || "Highlighted line marks the primary bottleneck."}
        </p>
      </div>
      <div className="chart-body">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
