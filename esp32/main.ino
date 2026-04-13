#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── WiFi & MQTT config ──────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "192.168.1.100";   // IP of Docker host
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "crop/sensors";
const char* DEVICE_ID     = "esp32-farm-01";

// ── Pin definitions ─────────────────────────────────────────────────
#define DHT_PIN         4       // DHT22 data pin
#define DHT_TYPE        DHT22
#define SOIL_MOISTURE_PIN 34    // Analog pin (ADC1)

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

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

void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("connected");
    } else {
      Serial.print("failed rc="); Serial.println(mqttClient.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  analogReadResolution(12);     // ESP32 12-bit ADC
  connectWiFi();
  connectMQTT();
}

void loop() {
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  float temperature    = dht.readTemperature();
  float humidity       = dht.readHumidity();
  float soilMoisture   = readSoilMoisture();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 read error — skipping");
    delay(5000);
    return;
  }

  // ── Build JSON payload ───────────────────────────────────────────
  StaticJsonDocument<256> doc;
  doc["device_id"]      = DEVICE_ID;
  doc["timestamp"]      = millis();           // replaced server-side
  doc["temperature"]    = temperature;
  doc["humidity"]       = humidity;
  doc["soil_moisture"]  = soilMoisture;

  char payload[256];
  serializeJson(doc, payload);

  mqttClient.publish(MQTT_TOPIC, payload);
  Serial.println("Published: " + String(payload));

  delay(10000);   // publish every 10 seconds
}