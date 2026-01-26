import React, { useEffect, useState } from "react";
import LineChart from "./LineChart.jsx";
import MetricCard from "./MetricCard.jsx";
import { loadFinanceInventoryData } from "../utils/loadFinanceInventoryData.js";
import {
    calculateFinanceInventoryMetrics,
    prepareInventoryCashChart,
    prepareCostAccumulationChart,
    prepareSalesPerformanceChart,
} from "../utils/financeInventoryMetrics.js";

export default function FinanceInventorySection() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        loadFinanceInventoryData()
            .then((data) => {
                if (isMounted) {
                    const calculatedMetrics = calculateFinanceInventoryMetrics(
                        data.finance,
                        data.inventory
                    );
                    setMetrics(calculatedMetrics);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Failed to load finance/inventory data:", err);
                    setError("Unable to load finance and inventory data.");
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <section id="finance-inventory" className="dashboard-section">
                <div className="section-header">
                    <div>
                        <h2>Finance & Inventory Control</h2>
                        <p>Loading financial and inventory data...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="finance-inventory" className="dashboard-section">
                <div className="section-header">
                    <div>
                        <h2>Finance & Inventory Control</h2>
                    </div>
                </div>
                <p className="error-banner">{error}</p>
            </section>
        );
    }

    if (!metrics) {
        return (
            <section id="finance-inventory" className="dashboard-section">
                <div className="section-header">
                    <div>
                        <h2>Finance & Inventory Control</h2>
                    </div>
                </div>
                <p className="empty-state">No finance or inventory data available.</p>
            </section>
        );
    }

    const inventoryCashChart = prepareInventoryCashChart(metrics);
    const costAccumulationChart = prepareCostAccumulationChart(metrics);
    const salesPerformanceChart = prepareSalesPerformanceChart(metrics);

    return (
        <section id="finance-inventory" className="dashboard-section">
            <div className="section-header">
                <div>
                    <h2>Finance & Inventory Control</h2>
                    <p>
                        Monitor cash flow, inventory levels, and cost accumulation to optimize
                        reorder decisions.
                    </p>
                </div>
                <span className="badge badge-finance">Finance & Inventory</span>
            </div>

            {/* Key Metrics Summary Cards */}
            <div className="card">
                <h3 style={{ marginBottom: "16px" }}>Key Performance Indicators</h3>
                <div className="metrics-grid">
                    <MetricCard
                        label="Total Stockout Days"
                        value={metrics.kpis.stockoutDays}
                        unit=" days"
                    />
                    <MetricCard
                        label="Average Inventory Level"
                        value={metrics.kpis.avgInventoryLevel}
                        unit=" units"
                    />
                    <MetricCard
                        label="Average Cash On Hand"
                        value={metrics.kpis.avgCashOnHand.toLocaleString()}
                        unit=" ฿"
                    />
                    <MetricCard
                        label="Inventory Cost Efficiency"
                        value={metrics.kpis.inventoryCostPerUnitSold}
                        unit="%"
                    />
                    <MetricCard
                        label="Number of Reorder Events"
                        value={metrics.kpis.reorderEvents}
                        unit=" times"
                    />
                </div>
            </div>

            {/* Charts */}
            <div className="chart-grid">
                {inventoryCashChart && (
                    <LineChart
                        chartData={inventoryCashChart}
                        title="Inventory vs Cash On Hand"
                        subtitle="Track inventory levels and cash flow over time. Reorder events impact cash availability."
                    />
                )}
                {costAccumulationChart && (
                    <LineChart
                        chartData={costAccumulationChart}
                        title="Cost Accumulation Breakdown"
                        subtitle="Cumulative costs over time. Identify which cost category dominates."
                    />
                )}
                {salesPerformanceChart && (
                    <LineChart
                        chartData={salesPerformanceChart}
                        title="Sales Performance Overview"
                        subtitle="Revenue from standard and custom sales. Correlate with inventory availability."
                    />
                )}
            </div>
        </section>
    );
}
