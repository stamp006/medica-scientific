import React, { useEffect, useMemo, useState } from "react";
import Tabs from "./components/Tabs.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import ChartSection from "./components/ChartSection.jsx";
import { loadDashboardData } from "./utils/loadDashboardData.js";

const tabOptions = [
  { key: "standard", label: "Standard" },
  { key: "custom", label: "Custom" },
];

function formatTimestamp(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("standard");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    loadDashboardData()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Unable to load dashboard data.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTabData = useMemo(() => {
    return dashboard?.tabs?.[activeTab] || null;
  }, [dashboard, activeTab]);

  return (
    <div className="page">
      <div className="page-glow" aria-hidden="true" />
      <header className="header reveal" style={{ animationDelay: "0.1s" }}>
        <div>
          <p className="eyebrow">Bottleneck Analysis</p>
          <h1>Bottleneck Analysis Dashboard</h1>
        </div>
        <div className="meta">
          <div>
            <p className="label">Simulation ID</p>
            <p className="value">{dashboard?.meta?.simulation_id || "N/A"}</p>
          </div>
          <div>
            <p className="label">Generated</p>
            <p className="value">{formatTimestamp(dashboard?.meta?.generated_at)}</p>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="reveal" style={{ animationDelay: "0.2s" }}>
          <Tabs items={tabOptions} activeKey={activeTab} onChange={setActiveTab} />
        </div>

        {error && <p className="error-banner">{error}</p>}

        <section className="reveal" style={{ animationDelay: "0.3s" }}>
          <SummaryCard summary={activeTabData?.summary} />
        </section>

        <section className="reveal" style={{ animationDelay: "0.4s" }}>
          <div className="section-header">
            <div>
              <h2>Scenario Metrics</h2>
              <p>Compare flows over time. The highlighted line shows the bottleneck.</p>
            </div>
            <span className="badge">{tabOptions.find((tab) => tab.key === activeTab)?.label}</span>
          </div>
          <ChartSection charts={activeTabData?.charts} />
        </section>
      </main>
    </div>
  );
}
