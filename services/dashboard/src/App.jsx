import React, { Component, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
const CROPS = ["wheat", "rice", "cotton", "maize"];

async function fetchHistory(limit = 200) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`History request failed: ${res.status}`);
  }
  return res.json();
}

async function requestPrediction(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Predict request failed: ${res.status}`);
  }
  return res.json();
}

function Card({ title, children }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetricChart({ title, data, dataKey, color, unit }) {
  return (
    <Card title={title}>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit={unit} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Chart render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="error">
          Chart renderer failed in this browser. Prediction and API checks still work.
        </section>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [crop, setCrop] = useState("wheat");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);

  const chartData = useMemo(
    () =>
      rows.map((r, i) => ({
        idx: i,
        time: r.server_ts ? new Date(r.server_ts).toLocaleTimeString() : String(i + 1),
        temperature: Number(r.temperature ?? 0),
        humidity: Number(r.humidity ?? 0),
        soil_moisture: Number(r.soil_moisture ?? 0),
        health_score: Number(r.health_score ?? 0),
      })),
    [rows]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError("");
        const data = await fetchHistory(200);
        if (active) {
          setRows(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to fetch history");
        }
      }
    };

    load();
    const id = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const onPredict = async () => {
    if (!rows.length) {
      setError("No data yet. Wait for sensor payloads.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const latest = rows[rows.length - 1];
      const result = await requestPrediction({
        crop_type: crop,
        temperature: latest.temperature,
        humidity: latest.humidity,
        soil_moisture: latest.soil_moisture,
      });
      setPrediction(result);
    } catch (e) {
      setError(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <header className="hero">
        <h1>Crop Analyzer</h1>
        <p>Live farm telemetry, health scoring, and recommendation dashboard</p>
      </header>

      <section className="toolbar">
        <label htmlFor="crop">Crop</label>
        <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {CROPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button onClick={onPredict} disabled={loading}>
          {loading ? "Predicting..." : "Get Prediction"}
        </button>
      </section>

      {prediction && (
        <section className="prediction">
          <strong>Health Score:</strong> {prediction.health_score}/100 | <strong>Model:</strong>{" "}
          {prediction.model_used} | <strong>Advice:</strong> {prediction.advice}
        </section>
      )}

      {error && <section className="error">{error}</section>}

      <ChartErrorBoundary>
        <section className="grid">
          <MetricChart
            title="Temperature"
            data={chartData}
            dataKey="temperature"
            color="#d64550"
            unit=" C"
          />
          <MetricChart
            title="Humidity"
            data={chartData}
            dataKey="humidity"
            color="#2d7ff9"
            unit=" %"
          />
          <MetricChart
            title="Soil Moisture"
            data={chartData}
            dataKey="soil_moisture"
            color="#2d9d66"
            unit=" %"
          />
          <MetricChart
            title="Health Score"
            data={chartData}
            dataKey="health_score"
            color="#ef7f1a"
            unit=""
          />
        </section>
      </ChartErrorBoundary>
    </main>
  );
}
