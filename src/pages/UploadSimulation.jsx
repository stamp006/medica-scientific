import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadSimulation } from "../services/uploadService.js";

export default function UploadSimulation() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");

  const fileLabel = useMemo(() => {
    if (!file) return "Choose Excel file (.xlsx)";
    return file.name;
  }, [file]);

  const handleFileChange = (event) => {
    setError("");
    setStatus("Idle");
    const selected = event.target.files?.[0] || null;
    console.log("Selected file:", selected);
    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("Idle");

    if (!file) {
      setError("Please select a .xlsx file before analyzing.");
      return;
    }

    setStatus("Uploading...");

    try {
      await uploadSimulation(file, {
        onStatus: (nextStatus) => setStatus(nextStatus),
      });
      setStatus("Success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setStatus("Error");
    }
  };

  return (
    <div className="page upload-page">
      <div className="page-glow" aria-hidden="true" />
      <header className="header reveal" style={{ animationDelay: "0.1s" }}>
        <div>
          <p className="eyebrow">Simulation Upload</p>
          <h1>Analyze a New Simulation</h1>
          <p className="header-subtitle">
            Upload an Excel file to reset outputs, run parsing, and refresh the dashboard.
          </p>
        </div>
      </header>

      <main className="content">
        <section className="card upload-card reveal" style={{ animationDelay: "0.2s" }}>
          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-field">
              <span className="upload-label">Simulation file</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={status === "Uploading..." || status === "Analyzing..."}
              />
              <span className="upload-filename">{fileLabel}</span>
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={!file || status === "Uploading..." || status === "Analyzing..."}
            >
              Upload & Analyze
            </button>
          </form>

          <div className="status-panel">
            <p className="status-label">Status</p>
            <p className="status-text">{status}</p>
          </div>
          {error && <p className="error-banner">{error}</p>}
        </section>
      </main>
    </div>
  );
}
