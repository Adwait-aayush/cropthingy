#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── WiFi & backend config ───────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_HOST  = "http://192.168.1.100:5000"; // Flask backend URL
const char* INGEST_PATH   = "/api/sensors/ingest";
const char* HEALTH_PATH   = "/api/health";
const char* DEVICE_API_KEY = "PASTE_DEVICE_API_KEY_FROM_REGISTER_RESPONSE";
const char* DEVICE_ID     = "esp32-farm-01";

// ── Pin definitions ─────────────────────────────────────────────────
#define DHT_PIN         4       // DHT22 data pin
#define DHT_TYPE        DHT22
#define SOIL_MOISTURE_PIN 34    // Analog pin (ADC1)

DHT dht(DHT_PIN, DHT_TYPE);

// ── Read soil moisture as percentage (0–100%) ────────────────────────
// Capacitive sensor: dry = ~3300 (12-bit), wet = ~1500
float readSoilMoisture() {
  int raw = analogRead(SOIL_MOISTURE_PIN);
  float pct = map(raw, 3300, 1500, 0, 100);
  return constrain(pct, 0.0, 100.0);
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
}

bool callHealthCheck() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  String url = String(BACKEND_HOST) + String(HEALTH_PATH);
  http.begin(url);
  int code = http.GET();
  Serial.print("Health check status: ");
  Serial.println(code);
  if (code > 0) {
    Serial.println(http.getString());
  }
  http.end();
  return code >= 200 && code < 300;
}

bool postSensorReading(float temperature, float humidity, float soilMoisture) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soilMoisture;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = String(BACKEND_HOST) + String(INGEST_PATH);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-KEY", DEVICE_API_KEY);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.print("POST /api/sensors/ingest status: ");
  Serial.println(code);
  Serial.println(response);
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  analogReadResolution(12);     // ESP32 12-bit ADC
  connectWiFi();
  callHealthCheck();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  float temperature    = dht.readTemperature();
  float humidity       = dht.readHumidity();
  float soilMoisture   = readSoilMoisture();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 read error — skipping");
    delay(5000);
    return;
  }

  bool ok = postSensorReading(temperature, humidity, soilMoisture);
  if (!ok) {
    Serial.println("Ingest failed, will retry next cycle");
  }

  delay(10000);   // publish every 10 seconds
}