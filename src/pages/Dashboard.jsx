import React, { useEffect, useMemo, useState } from "react";
import Tabs from "../components/Tabs.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import ChartSection from "../components/ChartSection.jsx";
import FinanceInventorySection from "../components/FinanceInventorySection.jsx";
import { loadDashboardData } from "../utils/loadDashboardData.js";

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

export default function Dashboard() {
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

      {/* Main Page Header */}
      <header className="header reveal" style={{ animationDelay: "0.1s" }}>
        <div>
          <p className="eyebrow">Medica Scientific Analytics</p>
          <h1>Simulation Dashboard</h1>
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
        {/* Finance & Inventory Section - NEW SECTION AT TOP */}
        <div className="reveal" style={{ animationDelay: "0.2s" }}>
          <FinanceInventorySection />
        </div>

        {/* Visual Divider */}
        <div className="dashboard-divider reveal" style={{ animationDelay: "0.3s" }}>
          <span className="divider-line"></span>
        </div>

        {/* Bottleneck Analysis Section - EXISTING SECTION BELOW */}
        <section id="bottleneck-analysis" className="dashboard-section reveal" style={{ animationDelay: "0.4s" }}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Bottleneck Analysis</p>
              <h2>Production Bottleneck Analysis</h2>
            </div>
          </div>

          <div className="reveal" style={{ animationDelay: "0.5s" }}>
            <Tabs items={tabOptions} activeKey={activeTab} onChange={setActiveTab} />
          </div>

          {error && <p className="error-banner">{error}</p>}

          <section className="reveal" style={{ animationDelay: "0.6s" }}>
            <SummaryCard summary={activeTabData?.summary} />
          </section>

          <section className="reveal" style={{ animationDelay: "0.7s" }}>
            <div className="section-header">
              <div>
                <h3>Scenario Metrics</h3>
                <p>Compare flows over time. The highlighted line shows the bottleneck.</p>
              </div>
              <span className="badge">{tabOptions.find((tab) => tab.key === activeTab)?.label}</span>
            </div>
            <ChartSection charts={activeTabData?.charts} />
          </section>
        </section>
      </main>
    </div>
  );
}
