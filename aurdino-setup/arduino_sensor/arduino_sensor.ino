#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL_PIN A0

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  Serial.println("DHT11 + Soil Moisture Sensor");
  dht.begin();
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int soilValue = analogRead(SOIL_PIN);
  int moisturePercent = map(soilValue, 1023, 0, 0, 100);

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("FAILED_DHT");
  } else {
    Serial.print("[SENSOR] Temp: ");
    Serial.print(temperature);
    Serial.print("°C | Humidity: ");
    Serial.print(humidity);
    Serial.print("% | Soil: ");
    Serial.print(moisturePercent);
    Serial.println("%");
  }

  Serial.print("[RAW] Soil Value: ");
  Serial.println(soilValue);
  Serial.println("----------------------");

  delay(2000);
}
