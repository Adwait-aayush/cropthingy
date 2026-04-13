import os, json, redis, requests
import plotly.graph_objs as go
from dash import Dash, dcc, html, Input, Output, State, callback_context
from dotenv import load_dotenv

load_dotenv()

rdb = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379, db=0)
INFERENCE_URL = os.getenv("INFERENCE_URL", "http://inference:8001")

app = Dash(__name__, title="Crop Analyzer Dashboard")

CROPS = ["wheat", "rice", "cotton", "maize"]

app.layout = html.Div([
    html.H2("Crop Analyzer Dashboard", style={"textAlign": "center", "padding": "20px"}),

    # ── Crop selector ──────────────────────────────────────────────
    html.Div([
        html.Label("Select Crop Type:"),
        dcc.Dropdown(id="crop-select", options=[{"label": c.title(), "value": c} for c in CROPS],
                     value="wheat", clearable=False, style={"width": "300px"}),
        html.Button("Get Prediction", id="predict-btn", n_clicks=0,
                    style={"marginLeft": "20px", "padding": "8px 20px"}),
    ], style={"display": "flex", "alignItems": "center", "padding": "0 40px 20px"}),

    # ── Prediction result ──────────────────────────────────────────
    html.Div(id="prediction-output",
             style={"padding": "0 40px 20px", "fontSize": "16px", "color": "#2c7"}),

    # ── Live sensor graphs ─────────────────────────────────────────
    html.Div([
        dcc.Graph(id="temp-graph",     style={"flex": 1}),
        dcc.Graph(id="humidity-graph", style={"flex": 1}),
        dcc.Graph(id="soil-graph",     style={"flex": 1}),
    ], style={"display": "flex", "gap": "10px", "padding": "0 20px"}),

    dcc.Graph(id="health-graph", style={"padding": "0 20px"}),

    dcc.Interval(id="interval", interval=10_000, n_intervals=0),   # refresh every 10s
], style={"fontFamily": "sans-serif", "maxWidth": "1400px", "margin": "auto"})

def fetch_history():
    items = rdb.lrange("dashboard_feed", 0, 199)
    return [json.loads(i) for i in reversed(items)]   # oldest first

@app.callback(
    Output("temp-graph",     "figure"),
    Output("humidity-graph", "figure"),
    Output("soil-graph",     "figure"),
    Output("health-graph",   "figure"),
    Input("interval",        "n_intervals"),
)
def update_graphs(_):
    data = fetch_history()
    if not data:
        empty = go.Figure()
        empty.update_layout(title="No data yet")
        return empty, empty, empty, empty

    ts    = [d.get("server_ts", i) for i, d in enumerate(data)]
    temps = [d["temperature"]   for d in data]
    hums  = [d["humidity"]      for d in data]
    soils = [d["soil_moisture"] for d in data]
    hs    = [d["health_score"]  for d in data]

    def make_fig(y_vals, title, color, yaxis_label):
        fig = go.Figure(go.Scatter(x=ts, y=y_vals, mode="lines+markers",
                                   line=dict(color=color, width=2)))
        fig.update_layout(title=title, xaxis_title="Time",
                          yaxis_title=yaxis_label, height=280,
                          margin=dict(l=40, r=20, t=40, b=40))
        return fig

    return (
        make_fig(temps, "Temperature (°C)",   "#e74c3c", "°C"),
        make_fig(hums,  "Humidity (%)",        "#3498db", "%"),
        make_fig(soils, "Soil Moisture (%)",   "#2ecc71", "%"),
        make_fig(hs,    "Crop Health Score",   "#f39c12", "Score (0–100)"),
    )

@app.callback(
    Output("prediction-output", "children"),
    Input("predict-btn", "n_clicks"),
    State("crop-select", "value"),
    prevent_initial_call=True,
)
def run_prediction(n_clicks, crop):
    history = fetch_history()
    if not history:
        return "No sensor data available yet."
    latest = history[-1]
    payload = {
        "crop_type":    crop,
        "temperature":  latest["temperature"],
        "humidity":     latest["humidity"],
        "soil_moisture": latest["soil_moisture"],
    }
    try:
        resp = requests.post(f"{INFERENCE_URL}/predict", json=payload, timeout=5)
        r    = resp.json()
        return (f"Health Score: {r['health_score']}/100  |  "
                f"Model: {r['model_used']}  |  Advice: {r['advice']}")
    except Exception as e:
        return f"Inference error: {e}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8050, debug=False)