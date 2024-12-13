import { defineStore } from 'pinia';
import mqttService from '../services/mqttService';

export const useSensorStore = defineStore('sensorStore', {
  state: () => ({
    waterLevel: 0, // Water level percentage
    pumpStatus: false, // Pump ON/OFF state
    autoMode: false, // Auto mode status
    autoLevel: 50, // Threshold for auto mode to activate pump (default 50%)
  }),

  actions: {
    // Initialize MQTT service and subscribe to water-level updates
    setupMQTT() {
      mqttService.init('wss://7200c4ee1f964ead96fa3d20dbd1135e.s1.eu.hivemq.cloud', {
        username: 'Danielpogi',
        password: 'Danielpogi123',
      });

      // Subscribe to the water-level topic
      mqttService.subscribe('water/level', (message) => {
        this.waterLevel = parseFloat(message); // Update state with water level
      });

      // Subscribe to the water/control topic (pump control)
      mqttService.subscribe('water/control', (message) => {
        this.pumpStatus = message === 'ON'; // Update pump status based on message
      });

      // Subscribe to auto-mode topic for auto mode control (if needed)
      mqttService.subscribe('auto-mode', (message) => {
        this.autoMode = message === 'ON'; // Update auto mode status based on message
      });
    },

    // Toggle the pump status and publish the command
    togglePump() {
      this.pumpStatus = !this.pumpStatus;
      mqttService.publish('water/control', this.pumpStatus ? 'ON' : 'OFF'); // Publish pump control message
    },

    // Toggle auto mode
    toggleAutoMode() {
      this.autoMode = !this.autoMode;
      mqttService.publish('auto-mode', this.autoMode ? 'ON' : 'OFF'); // Publish auto mode control message
    },

    // Set the auto level threshold
    setAutoLevel(level) {
      this.autoLevel = level;
      if (this.autoMode && this.waterLevel <= this.autoLevel) {
        this.togglePump(); // Automatically turn on the pump if threshold is reached
      }
    },
  },
});
