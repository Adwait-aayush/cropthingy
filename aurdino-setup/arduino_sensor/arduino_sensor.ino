#include <DHT.h>

#define DHTPIN 7
#define DHTTYPE DHT11

#define SOIL_PIN A0   // Analog pin for soil sensor

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  Serial.println("DHT11 + Soil Moisture Sensor");

  dht.begin();
}

void loop() {
  // ----- DHT11 -----
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // ----- Soil Moisture -----
  int soilValue = analogRead(SOIL_PIN);

  // Convert to percentage (approx)
  int moisturePercent = map(soilValue, 1023, 0, 0, 100);

  // ----- Check DHT -----
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ Failed to read from DHT sensor!");
  } else {
    Serial.print("🌡 Temp: ");
    Serial.print(temperature);
    Serial.print(" °C  |  💧 Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  // ----- Print Soil -----
  Serial.print("🌱 Soil Moisture: ");
  Serial.print(moisturePercent);
  Serial.println(" %");

  // Raw value (for debugging)
  Serial.print("Raw Soil Value: ");
  Serial.println(soilValue);

  Serial.println("----------------------");

  delay(2000);
}