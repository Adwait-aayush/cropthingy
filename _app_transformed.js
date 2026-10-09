import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false};import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=99690f01"; const Component = __vite__cjsImport0_react["Component"]; const useEffect = __vite__cjsImport0_react["useEffect"]; const useMemo = __vite__cjsImport0_react["useMemo"]; const useState = __vite__cjsImport0_react["useState"];
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "/node_modules/.vite/deps/recharts.js?v=bc0920bd";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
const CROPS = ["wheat", "rice", "cotton", "maize"];
async function fetchHistory(limit = 200) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`History request failed: ${res.status}`);
  }
  return res.json();
}
async function fetchDevices() {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) {
    throw new Error(`Devices request failed: ${res.status}`);
  }
  return res.json();
}
async function requestPrediction(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Predict request failed: ${res.status}`);
  }
  return res.json();
}
function Card({ title, children }) {
  return /* @__PURE__ */ React.createElement("section", { className: "card" }, /* @__PURE__ */ React.createElement("h3", null, title), children);
}
function AlertBadge({ label, active }) {
  return /* @__PURE__ */ React.createElement(
    "span",
    { className: `alertBadge ${active ? "alertBadge--on" : "alertBadge--off"}` },
    label
  );
}
function DeviceCard({ device }) {
  const lastSeen = device.server_ts ? new Date(device.server_ts).toLocaleString() : "\u2014";
  return /* @__PURE__ */ React.createElement("div", { className: "deviceCard" },
    /* @__PURE__ */ React.createElement("div", { className: "deviceCard__header" },
      /* @__PURE__ */ React.createElement("span", { className: "deviceCard__id" }, device.device_id ?? "unknown"),
      /* @__PURE__ */ React.createElement("span", { className: "deviceCard__crop" }, device.crop_type ?? "\u2014")
    ),
    /* @__PURE__ */ React.createElement("div", { className: "deviceCard__metrics" },
      /* @__PURE__ */ React.createElement("div", { className: "deviceCard__metric" },
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricLabel" }, "Temp"),
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricValue" }, device.temperature ?? "\u2014", " \xB0C")
      ),
      /* @__PURE__ */ React.createElement("div", { className: "deviceCard__metric" },
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricLabel" }, "Humidity"),
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricValue" }, device.humidity ?? "\u2014", " %")
      ),
      /* @__PURE__ */ React.createElement("div", { className: "deviceCard__metric" },
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricLabel" }, "Soil"),
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricValue" }, device.soil_moisture ?? "\u2014", " %")
      ),
      /* @__PURE__ */ React.createElement("div", { className: "deviceCard__metric" },
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricLabel" }, "Health"),
        /* @__PURE__ */ React.createElement("span", { className: "deviceCard__metricValue" }, device.health_score ?? "\u2014")
      )
    ),
    /* @__PURE__ */ React.createElement("div", { className: "deviceCard__alerts" },
      /* @__PURE__ */ React.createElement(AlertBadge, { label: "Temp \u26A0", active: device.alert_temp }),
      /* @__PURE__ */ React.createElement(AlertBadge, { label: "Humidity \u26A0", active: device.alert_humidity }),
      /* @__PURE__ */ React.createElement(AlertBadge, { label: "Soil \u26A0", active: device.alert_soil })
    ),
    /* @__PURE__ */ React.createElement("div", { className: "deviceCard__lastSeen" }, "Last seen: ", lastSeen)
  );
}
function MetricChart({ title, data, dataKey, color, unit }) {
  return /* @__PURE__ */ React.createElement(Card, { title }, /* @__PURE__ */ React.createElement("div", { className: "chartWrap" }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 260 }, /* @__PURE__ */ React.createElement(LineChart, { data }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "#d9e2ec" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "time", tick: { fontSize: 11 } }), /* @__PURE__ */ React.createElement(YAxis, { tick: { fontSize: 11 }, unit }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(
    Line,
    {
      type: "monotone",
      dataKey,
      stroke: color,
      strokeWidth: 2.5,
      dot: false,
      activeDot: { r: 5 }
    }
  )))));
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
      return /* @__PURE__ */ React.createElement("section", { className: "error" }, "Chart renderer failed in this browser. Prediction and API checks still work.");
    }
    return this.props.children;
  }
}
export default function App() {
  const [crop, setCrop] = useState("wheat");
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const chartData = useMemo(
    () => rows.map((r, i) => ({
      idx: i,
      time: r.server_ts ? new Date(r.server_ts).toLocaleTimeString() : String(i + 1),
      temperature: Number(r.temperature ?? 0),
      humidity: Number(r.humidity ?? 0),
      soil_moisture: Number(r.soil_moisture ?? 0),
      health_score: Number(r.health_score ?? 0)
    })),
    [rows]
  );
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setError("");
        const [histData, devData] = await Promise.all([fetchHistory(200), fetchDevices()]);
        if (active) {
          setRows(Array.isArray(histData.items) ? histData.items : []);
          setDevices(Array.isArray(devData.devices) ? devData.devices : []);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to fetch data");
        }
      }
    };
    load();
    const id = setInterval(load, 8e3);
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
        soil_moisture: latest.soil_moisture
      });
      setPrediction(result);
    } catch (e) {
      setError(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("main", { className: "app" },
    /* @__PURE__ */ React.createElement("header", { className: "hero" },
      /* @__PURE__ */ React.createElement("h1", null, "Crop Analyzer"),
      /* @__PURE__ */ React.createElement("p", null, "Live farm telemetry, health scoring, and recommendation dashboard")
    ),
    /* @__PURE__ */ React.createElement("section", { className: "toolbar" },
      /* @__PURE__ */ React.createElement("label", { htmlFor: "crop" }, "Crop"),
      /* @__PURE__ */ React.createElement("select", { id: "crop", value: crop, onChange: (e) => setCrop(e.target.value) },
        CROPS.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c))
      ),
      /* @__PURE__ */ React.createElement("button", { onClick: onPredict, disabled: loading },
        loading ? "Predicting..." : "Get Prediction"
      )
    ),
    prediction && /* @__PURE__ */ React.createElement("section", { className: "prediction" },
      /* @__PURE__ */ React.createElement("strong", null, "Health Score:"), " ", prediction.health_score, "/100 | ",
      /* @__PURE__ */ React.createElement("strong", null, "Model:"), " ", prediction.model_used, " | ",
      /* @__PURE__ */ React.createElement("strong", null, "Advice:"), " ", prediction.advice
    ),
    error && /* @__PURE__ */ React.createElement("section", { className: "error" }, error),
    devices.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "hardwareSection" },
      /* @__PURE__ */ React.createElement("h2", { className: "hardwareSection__title" },
        "Hardware & Sensor Status",
        /* @__PURE__ */ React.createElement("span", { className: "hardwareSection__count" },
          devices.length, " device", devices.length !== 1 ? "s" : ""
        )
      ),
      /* @__PURE__ */ React.createElement("div", { className: "deviceGrid" },
        devices.map((d, i) => /* @__PURE__ */ React.createElement(DeviceCard, { key: d.device_id ?? i, device: d }))
      )
    ),
    /* @__PURE__ */ React.createElement(ChartErrorBoundary, null,
      /* @__PURE__ */ React.createElement("section", { className: "grid" },
        /* @__PURE__ */ React.createElement(MetricChart, { title: "Temperature", data: chartData, dataKey: "temperature", color: "#d64550", unit: " C" }),
        /* @__PURE__ */ React.createElement(MetricChart, { title: "Humidity", data: chartData, dataKey: "humidity", color: "#2d7ff9", unit: " %" }),
        /* @__PURE__ */ React.createElement(MetricChart, { title: "Soil Moisture", data: chartData, dataKey: "soil_moisture", color: "#2d9d66", unit: " %" }),
        /* @__PURE__ */ React.createElement(MetricChart, { title: "Health Score", data: chartData, dataKey: "health_score", color: "#ef7f1a", unit: "" })
      )
    )
  );
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFwcC5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xyXG5pbXBvcnQge1xyXG4gIExpbmUsXHJcbiAgTGluZUNoYXJ0LFxyXG4gIFJlc3BvbnNpdmVDb250YWluZXIsXHJcbiAgVG9vbHRpcCxcclxuICBYQXhpcyxcclxuICBZQXhpcyxcclxuICBDYXJ0ZXNpYW5HcmlkLFxyXG59IGZyb20gXCJyZWNoYXJ0c1wiO1xyXG5cclxuY29uc3QgQVBJX0JBU0UgPSBpbXBvcnQubWV0YS5lbnYuVklURV9BUElfQkFTRV9VUkwgfHwgXCJodHRwOi8vbG9jYWxob3N0OjgwMDFcIjtcclxuY29uc3QgQ1JPUFMgPSBbXCJ3aGVhdFwiLCBcInJpY2VcIiwgXCJjb3R0b25cIiwgXCJtYWl6ZVwiXTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoSGlzdG9yeShsaW1pdCA9IDIwMCkge1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0FQSV9CQVNFfS9oaXN0b3J5P2xpbWl0PSR7bGltaXR9YCk7XHJcbiAgaWYgKCFyZXMub2spIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgSGlzdG9yeSByZXF1ZXN0IGZhaWxlZDogJHtyZXMuc3RhdHVzfWApO1xyXG4gIH1cclxuICByZXR1cm4gcmVzLmpzb24oKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVxdWVzdFByZWRpY3Rpb24ocGF5bG9hZCkge1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0FQSV9CQVNFfS9wcmVkaWN0YCwge1xyXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxyXG4gIH0pO1xyXG4gIGlmICghcmVzLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFByZWRpY3QgcmVxdWVzdCBmYWlsZWQ6ICR7cmVzLnN0YXR1c31gKTtcclxuICB9XHJcbiAgcmV0dXJuIHJlcy5qc29uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENhcmQoeyB0aXRsZSwgY2hpbGRyZW4gfSkge1xyXG4gIHJldHVybiAoXHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJjYXJkXCI+XHJcbiAgICAgIDxoMz57dGl0bGV9PC9oMz5cclxuICAgICAge2NoaWxkcmVufVxyXG4gICAgPC9zZWN0aW9uPlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE1ldHJpY0NoYXJ0KHsgdGl0bGUsIGRhdGEsIGRhdGFLZXksIGNvbG9yLCB1bml0IH0pIHtcclxuICByZXR1cm4gKFxyXG4gICAgPENhcmQgdGl0bGU9e3RpdGxlfT5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjaGFydFdyYXBcIj5cclxuICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezI2MH0+XHJcbiAgICAgICAgICA8TGluZUNoYXJ0IGRhdGE9e2RhdGF9PlxyXG4gICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiBzdHJva2U9XCIjZDllMmVjXCIgLz5cclxuICAgICAgICAgICAgPFhBeGlzIGRhdGFLZXk9XCJ0aW1lXCIgdGljaz17eyBmb250U2l6ZTogMTEgfX0gLz5cclxuICAgICAgICAgICAgPFlBeGlzIHRpY2s9e3sgZm9udFNpemU6IDExIH19IHVuaXQ9e3VuaXR9IC8+XHJcbiAgICAgICAgICAgIDxUb29sdGlwIC8+XHJcbiAgICAgICAgICAgIDxMaW5lXHJcbiAgICAgICAgICAgICAgdHlwZT1cIm1vbm90b25lXCJcclxuICAgICAgICAgICAgICBkYXRhS2V5PXtkYXRhS2V5fVxyXG4gICAgICAgICAgICAgIHN0cm9rZT17Y29sb3J9XHJcbiAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9ezIuNX1cclxuICAgICAgICAgICAgICBkb3Q9e2ZhbHNlfVxyXG4gICAgICAgICAgICAgIGFjdGl2ZURvdD17eyByOiA1IH19XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICA8L0xpbmVDaGFydD5cclxuICAgICAgICA8L1Jlc3BvbnNpdmVDb250YWluZXI+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9DYXJkPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCgpIHtcclxuICBjb25zdCBbY3JvcCwgc2V0Q3JvcF0gPSB1c2VTdGF0ZShcIndoZWF0XCIpO1xyXG4gIGNvbnN0IFtyb3dzLCBzZXRSb3dzXSA9IHVzZVN0YXRlKFtdKTtcclxuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZShcIlwiKTtcclxuICBjb25zdCBbcHJlZGljdGlvbiwgc2V0UHJlZGljdGlvbl0gPSB1c2VTdGF0ZShudWxsKTtcclxuXHJcbiAgY29uc3QgY2hhcnREYXRhID0gdXNlTWVtbyhcclxuICAgICgpID0+XHJcbiAgICAgIHJvd3MubWFwKChyLCBpKSA9PiAoe1xyXG4gICAgICAgIGlkeDogaSxcclxuICAgICAgICB0aW1lOiByLnNlcnZlcl90cyA/IG5ldyBEYXRlKHIuc2VydmVyX3RzKS50b0xvY2FsZVRpbWVTdHJpbmcoKSA6IFN0cmluZyhpICsgMSksXHJcbiAgICAgICAgdGVtcGVyYXR1cmU6IE51bWJlcihyLnRlbXBlcmF0dXJlID8/IDApLFxyXG4gICAgICAgIGh1bWlkaXR5OiBOdW1iZXIoci5odW1pZGl0eSA/PyAwKSxcclxuICAgICAgICBzb2lsX21vaXN0dXJlOiBOdW1iZXIoci5zb2lsX21vaXN0dXJlID8/IDApLFxyXG4gICAgICAgIGhlYWx0aF9zY29yZTogTnVtYmVyKHIuaGVhbHRoX3Njb3JlID8/IDApLFxyXG4gICAgICB9KSksXHJcbiAgICBbcm93c11cclxuICApO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgbGV0IGFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgY29uc3QgbG9hZCA9IGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzZXRFcnJvcihcIlwiKTtcclxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2hIaXN0b3J5KDIwMCk7XHJcbiAgICAgICAgaWYgKGFjdGl2ZSkge1xyXG4gICAgICAgICAgc2V0Um93cyhBcnJheS5pc0FycmF5KGRhdGEuaXRlbXMpID8gZGF0YS5pdGVtcyA6IFtdKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBpZiAoYWN0aXZlKSB7XHJcbiAgICAgICAgICBzZXRFcnJvcihlLm1lc3NhZ2UgfHwgXCJGYWlsZWQgdG8gZmV0Y2ggaGlzdG9yeVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgbG9hZCgpO1xyXG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbChsb2FkLCA4MDAwKTtcclxuICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICBjbGVhckludGVydmFsKGlkKTtcclxuICAgIH07XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBvblByZWRpY3QgPSBhc3luYyAoKSA9PiB7XHJcbiAgICBpZiAoIXJvd3MubGVuZ3RoKSB7XHJcbiAgICAgIHNldEVycm9yKFwiTm8gZGF0YSB5ZXQuIFdhaXQgZm9yIHNlbnNvciBwYXlsb2Fkcy5cIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBzZXRMb2FkaW5nKHRydWUpO1xyXG4gICAgc2V0RXJyb3IoXCJcIik7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBsYXRlc3QgPSByb3dzW3Jvd3MubGVuZ3RoIC0gMV07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcXVlc3RQcmVkaWN0aW9uKHtcclxuICAgICAgICBjcm9wX3R5cGU6IGNyb3AsXHJcbiAgICAgICAgdGVtcGVyYXR1cmU6IGxhdGVzdC50ZW1wZXJhdHVyZSxcclxuICAgICAgICBodW1pZGl0eTogbGF0ZXN0Lmh1bWlkaXR5LFxyXG4gICAgICAgIHNvaWxfbW9pc3R1cmU6IGxhdGVzdC5zb2lsX21vaXN0dXJlLFxyXG4gICAgICB9KTtcclxuICAgICAgc2V0UHJlZGljdGlvbihyZXN1bHQpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBzZXRFcnJvcihlLm1lc3NhZ2UgfHwgXCJQcmVkaWN0aW9uIGZhaWxlZFwiKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8bWFpbiBjbGFzc05hbWU9XCJhcHBcIj5cclxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJoZXJvXCI+XHJcbiAgICAgICAgPGgxPkNyb3AgQW5hbHl6ZXI8L2gxPlxyXG4gICAgICAgIDxwPkxpdmUgZmFybSB0ZWxlbWV0cnksIGhlYWx0aCBzY29yaW5nLCBhbmQgcmVjb21tZW5kYXRpb24gZGFzaGJvYXJkPC9wPlxyXG4gICAgICA8L2hlYWRlcj5cclxuXHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvb2xiYXJcIj5cclxuICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImNyb3BcIj5Dcm9wPC9sYWJlbD5cclxuICAgICAgICA8c2VsZWN0IGlkPVwiY3JvcFwiIHZhbHVlPXtjcm9wfSBvbkNoYW5nZT17KGUpID0+IHNldENyb3AoZS50YXJnZXQudmFsdWUpfT5cclxuICAgICAgICAgIHtDUk9QUy5tYXAoKGMpID0+IChcclxuICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2N9IHZhbHVlPXtjfT5cclxuICAgICAgICAgICAgICB7Y31cclxuICAgICAgICAgICAgPC9vcHRpb24+XHJcbiAgICAgICAgICApKX1cclxuICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e29uUHJlZGljdH0gZGlzYWJsZWQ9e2xvYWRpbmd9PlxyXG4gICAgICAgICAge2xvYWRpbmcgPyBcIlByZWRpY3RpbmcuLi5cIiA6IFwiR2V0IFByZWRpY3Rpb25cIn1cclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAge3ByZWRpY3Rpb24gJiYgKFxyXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInByZWRpY3Rpb25cIj5cclxuICAgICAgICAgIDxzdHJvbmc+SGVhbHRoIFNjb3JlOjwvc3Ryb25nPiB7cHJlZGljdGlvbi5oZWFsdGhfc2NvcmV9LzEwMCB8IDxzdHJvbmc+TW9kZWw6PC9zdHJvbmc+e1wiIFwifVxyXG4gICAgICAgICAge3ByZWRpY3Rpb24ubW9kZWxfdXNlZH0gfCA8c3Ryb25nPkFkdmljZTo8L3N0cm9uZz4ge3ByZWRpY3Rpb24uYWR2aWNlfVxyXG4gICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgKX1cclxuXHJcbiAgICAgIHtlcnJvciAmJiA8c2VjdGlvbiBjbGFzc05hbWU9XCJlcnJvclwiPntlcnJvcn08L3NlY3Rpb24+fVxyXG5cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwiZ3JpZFwiPlxyXG4gICAgICAgIDxNZXRyaWNDaGFydFxyXG4gICAgICAgICAgdGl0bGU9XCJUZW1wZXJhdHVyZVwiXHJcbiAgICAgICAgICBkYXRhPXtjaGFydERhdGF9XHJcbiAgICAgICAgICBkYXRhS2V5PVwidGVtcGVyYXR1cmVcIlxyXG4gICAgICAgICAgY29sb3I9XCIjZDY0NTUwXCJcclxuICAgICAgICAgIHVuaXQ9XCIgQ1wiXHJcbiAgICAgICAgLz5cclxuICAgICAgICA8TWV0cmljQ2hhcnRcclxuICAgICAgICAgIHRpdGxlPVwiSHVtaWRpdHlcIlxyXG4gICAgICAgICAgZGF0YT17Y2hhcnREYXRhfVxyXG4gICAgICAgICAgZGF0YUtleT1cImh1bWlkaXR5XCJcclxuICAgICAgICAgIGNvbG9yPVwiIzJkN2ZmOVwiXHJcbiAgICAgICAgICB1bml0PVwiICVcIlxyXG4gICAgICAgIC8+XHJcbiAgICAgICAgPE1ldHJpY0NoYXJ0XHJcbiAgICAgICAgICB0aXRsZT1cIlNvaWwgTW9pc3R1cmVcIlxyXG4gICAgICAgICAgZGF0YT17Y2hhcnREYXRhfVxyXG4gICAgICAgICAgZGF0YUtleT1cInNvaWxfbW9pc3R1cmVcIlxyXG4gICAgICAgICAgY29sb3I9XCIjMmQ5ZDY2XCJcclxuICAgICAgICAgIHVuaXQ9XCIgJVwiXHJcbiAgICAgICAgLz5cclxuICAgICAgICA8TWV0cmljQ2hhcnRcclxuICAgICAgICAgIHRpdGxlPVwiSGVhbHRoIFNjb3JlXCJcclxuICAgICAgICAgIGRhdGE9e2NoYXJ0RGF0YX1cclxuICAgICAgICAgIGRhdGFLZXk9XCJoZWFsdGhfc2NvcmVcIlxyXG4gICAgICAgICAgY29sb3I9XCIjZWY3ZjFhXCJcclxuICAgICAgICAgIHVuaXQ9XCJcIlxyXG4gICAgICAgIC8+XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuICAgIDwvbWFpbj5cclxuICApO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxXQUFXLFNBQVMsZ0JBQWdCO0FBQzdDO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0s7QUFFUCxNQUFNLFdBQVcsWUFBWSxJQUFJLHFCQUFxQjtBQUN0RCxNQUFNLFFBQVEsQ0FBQyxTQUFTLFFBQVEsVUFBVSxPQUFPO0FBRWpELGVBQWUsYUFBYSxRQUFRLEtBQUs7QUFDdkMsUUFBTSxNQUFNLE1BQU0sTUFBTSxHQUFHLFFBQVEsa0JBQWtCLEtBQUssRUFBRTtBQUM1RCxNQUFJLENBQUMsSUFBSSxJQUFJO0FBQ1gsVUFBTSxJQUFJLE1BQU0sMkJBQTJCLElBQUksTUFBTSxFQUFF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
