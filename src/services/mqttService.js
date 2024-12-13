// mqttService.js
import mqtt from 'mqtt';

let client = null;

export const mqttService = {
  // Initialize the MQTT client
  init(brokerUrl, options) {
    client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
      console.log('MQTT connected');
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
    });
  },

  // Subscribe to a topic
  subscribe(topic, callback) {
    if (client) {
      client.subscribe(topic, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${topic}`);
        } else {
          console.error(`Failed to subscribe to topic: ${topic}`, err);
        }
      });

      // Add a custom message callback for this topic
      client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          callback(message.toString());
        }
      });
    } else {
      console.error('MQTT client not initialized.');
    }
  },

  // Publish a message to a topic
  publish(topic, message) {
    if (client) {
      client.publish(topic, message, (err) => {
        if (!err) {
          console.log(`Message "${message}" published to topic: ${topic}`);
        } else {
          console.error(`Failed to publish message to topic: ${topic}`, err);
        }
      });
    } else {
      console.error('MQTT client not initialized.');
    }
  },

  // Disconnect the client
  disconnect() {
    if (client) {
      client.end();
      console.log('MQTT client disconnected');
    } else {
      console.error('MQTT client not initialized.');
    }
  },

  // New method to control pump via the "water/control" topic
  togglePump(status) {
    this.publish('water/control', status ? 'ON' : 'OFF');
  },

  // Method to control auto mode via the "auto-mode" topic
  setAutoMode(status) {
    this.publish('auto-mode', status ? 'ON' : 'OFF');
  },

  // Add an on method to listen to any topic
  on(topic, callback) {
    if (client) {
      client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          callback(message.toString());
        }
      });
    } else {
      console.error('MQTT client not initialized.');
    }
  },
};

export default mqttService;
