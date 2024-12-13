#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// Wi-Fi credentials
const char* ssid = "Daniel";
const char* password = "nopassword";

// MQTT broker settings
const char* mqttServer = "7200c4ee1f964ead96fa3d20dbd1135e.s1.eu.hivemq.cloud";  // HiveMQ Cloud Broker URL
const int mqttPort = 8883;                                                       // MQTT over SSL port
const char* mqttUser = "Danielpogi";                                             // MQTT Username
const char* mqttPassword = "Danielpogi123";                                      // MQTT Password

WiFiClientSecure espClient;  // Use Secure Client for SSL
PubSubClient client(espClient);

// Variables for sensor data and pump control
float waterLevel = 0;     // Water level sensor data (0-100%)
bool pumpStatus = false;  // Pump status (ON/OFF)

// MQTT topics
const char* waterLevelTopic = "water/level";
const char* pumpControlTopic = "water/control";

// Setup function
void setup() {
  // Start Serial Monitor for debugging
  Serial.begin(115200);
  delay(10);

  // Connect to Wi-Fi
  setupWiFi();

  // Setup MQTT Client
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);

  // SSL/TLS setup for MQTT (ensure that the certificate is installed for secure connection)
  espClient.setInsecure();  // If SSL cert is not available, use this line
  delay(1000);
}

// Connect to Wi-Fi
void setupWiFi() {
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting...");
  }
  Serial.println("Wi-Fi Connected!");
  Serial.println("IP Address: " + WiFi.localIP().toString());
}

// MQTT Callback function to handle received messages
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  // Handle pump control command
  if (String(topic) == pumpControlTopic) {
    if (message == "ON") {
      pumpStatus = true;
      Serial.println("Pump turned ON");
      // Insert code to control the pump (e.g., trigger relay)
    } else if (message == "OFF") {
      pumpStatus = false;
      Serial.println("Pump turned OFF");
      // Insert code to stop the pump (e.g., release relay)
    }
  }
}

// Reconnect to MQTT if the connection is lost
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP8266Client", mqttUser, mqttPassword)) {
      Serial.println("Connected to MQTT Broker!");
      client.subscribe(waterLevelTopic);  // Subscribe to water level topic
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

// Main loop function
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Simulate sensor data (replace with actual sensor readings)
  waterLevel = analogRead(A0);                    // Read from water level sensor (pin A0)
  waterLevel = map(waterLevel, 0, 1023, 0, 100);  // Map the sensor value to 0-100%

  // Check if waterLevel is a valid number and falls within the 0-100% range
  if (!isnan(waterLevel) && waterLevel >= 0 && waterLevel <= 100) {
    // Publish water level data to MQTT broker
    String payload = String(waterLevel);
    client.publish(waterLevelTopic, payload.c_str());
  } else {
    Serial.println("Invalid water level detected, skipping publishing...");
  }

  // Optional: Add a delay to publish data at regular intervals
  delay(5000);  // Delay 5 seconds before the next reading
}
