import React from "react";

export default function MetricCard({ label, value, unit = "" }) {
    return (
        <div className="metric-card">
            <p className="metric-label">{label}</p>
            <p className="metric-value">
                {value !== null && value !== undefined ? value : "N/A"}
                {unit && value !== null && value !== undefined && (
                    <span className="metric-unit">{unit}</span>
                )}
            </p>
        </div>
    );
}
