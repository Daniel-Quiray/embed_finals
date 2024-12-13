<template>
    <div id="web-app" class="text-center">
      <header class="bg-primary text-white py-3">
        <div class="container">
          <h1 class="display-4">Water Level Monitoring System</h1>
        </div>
      </header>
  
      <main>
        <div class="container mt-5">
          <!-- Current Water Level Display -->
          <section class="status mb-4">
            <h2 class="h4">Current Water Level</h2>
  
            <!-- Water Tank Illustration -->
            <div class="water-tank mb-3">
              <div
                class="water"
                :style="{ height: `${constrainedWaterLevel}%`, transition: 'height 0.5s ease-in-out' }"
              ></div>
              <!-- Tank Outline -->
              <div class="tank-outline"></div>
            </div>
            <p class="h4">{{ waterLevel }}%</p>
          </section>
  
          <!-- Pump Control Section -->
          <section class="controls mb-4">
            <h2 class="h4 mb-0">Water Control</h2>
            <div class="button-group d-flex justify-content-center mb-3">
              <button
                class="btn ghost mr-3"
                @mousedown="controlPump('ON')"
                @mouseup="stopPump"
                @mouseleave="stopPump"
              >
                <i class="fas fa-power-off"></i> Hold to Pump (On)
              </button>
              <button
                class="btn ghost"
                @click="toggleAutoMode"
              >
                <i class="fas" :class="autoMode ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                {{ autoMode ? 'Disable Auto' : 'Enable Auto' }}
              </button>
            </div>
  
            <p class="mt-3 status-text">
              Status:
              <span :class="{ 'text-success': pumpStatus, 'text-danger': !pumpStatus }">
                <strong>{{ pumpStatus ? 'Active' : 'Inactive' }}</strong>
              </span>
            </p>
          </section>
  
          <!-- Always Visible Auto Mode Settings -->
          <section class="auto-settings">
            <label for="auto-level" class="h5">Set Auto Level (%):</label>
            <input
              id="auto-level"
              type="number"
              v-model.number="autoLevel"
              min="0"
              max="100"
              class="form-control mt-2"
              style="width: 100px;"
            />
          </section>
  
          <!-- Table for Last 10 Readings -->
          <section class="mt-5">
            <h2 class="h4 mb-3">Last 10 Readings</h2>
            <table class="table table-striped table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Water Level (%)</th>
                  <th scope="col">Pump Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reading, index) in lastReadings" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ reading.timestamp }}</td>
                  <td>{{ reading.waterLevel }}%</td>
                  <td>
                    <span :class="{'text-success': reading.pumpStatus, 'text-danger': !reading.pumpStatus}">
                      {{ reading.pumpStatus ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import { useSensorStore } from '../stores/sensorStore.js';
  import { onMounted, computed, ref } from 'vue';
  import mqttService from '../services/mqttService';
  
  export default {
    setup() {
      const sensorStore = useSensorStore();
  
      // Reactive properties
      const waterLevel = sensorStore.waterLevel;
      const pumpStatus = sensorStore.pumpStatus;
      const autoMode = sensorStore.autoMode;
      const autoLevel = sensorStore.autoLevel;
  
      // Reactive array to store last 10 readings
      const lastReadings = ref([]);
  
      // Function to update last 10 readings
      const addReading = (reading) => {
        if (lastReadings.value.length >= 10) {
          lastReadings.value.shift(); // Remove the first element if there are more than 10 readings
        }
        lastReadings.value.push(reading); // Add the new reading to the array
      };
  
      // Initialize MQTT on mount
      onMounted(() => {
        sensorStore.setupMQTT();
  
        // Subscribe to 'water/data' topic
        mqttService.subscribe('water/data', (data) => {
          const newReading = {
            timestamp: new Date().toLocaleString(),
            waterLevel: data.waterLevel,
            pumpStatus: data.pumpStatus,
          };
          addReading(newReading);
        });
      });
  
      // Constrained water level (0-100%)
      const constrainedWaterLevel = computed(() => Math.min(100, Math.max(0, waterLevel)));
  
      // Control Pump
      const controlPump = (command) => {
        if (command === 'ON') {
          mqttService.publish('water/control', 'ON');
          sensorStore.pumpActive = true;
        }
      };
  
      // Stop Pump
      const stopPump = () => {
        if (sensorStore.pumpActive) {
          mqttService.publish('water/control', 'OFF');
          sensorStore.pumpActive = false;
        }
      };
  
      // Toggle Auto Mode
      const toggleAutoMode = () => {
        sensorStore.autoMode = !sensorStore.autoMode;
        mqttService.setAutoMode(sensorStore.autoMode);
      };
  
      // Watch for auto control to manage pump state
      setInterval(() => {
        if (sensorStore.autoMode && sensorStore.waterLevel < sensorStore.autoLevel && !sensorStore.pumpActive) {
          controlPump('ON');
        } else if (sensorStore.autoMode && sensorStore.pumpActive) {
          stopPump();
        }
      }, 1000);
  
      return {
        waterLevel,
        pumpStatus,
        autoMode,
        autoLevel,
        constrainedWaterLevel,
        controlPump,
        stopPump,
        toggleAutoMode,
        lastReadings,
      };
    },
  };
  </script>
  
  <style scoped>
  /* General Styles */
  body {
    font-family: 'Roboto', sans-serif;
    background-color: #f4f7f6;
    color: #333;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  h1, h2 {
    font-weight: bold;
    color: #2d3436;
  }
  
  .container {
    padding: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* Header Styles */
  header {
    background-color: #0984e3;
    color: white;
    padding: 20px 0;
    margin-bottom: 20px;
  }
  
  header h1 {
    font-size: 2.5rem;
    margin: 0;
    text-align: center;
  }
  
  /* Section Styles */
  section {
    margin-bottom: 30px;
  }
  
  /* Water Level Display */
  .status {
    margin-bottom: 30px;
  }
  
  h2.h4 {
    font-size: 1.2rem;
    color: #2d3436;
    margin-bottom: 15px;
  }
  
  .water-tank {
    position: relative;
    width: 100%;
    max-width: 120px;
    height: 200px;
    margin: 0 auto;
    border: 2px solid #0984e3;
    border-radius: 10px;
    background-color: #e3f2fd;
    overflow: hidden;
  }
  
  .water {
    width: 100%;
    background-color: #00bcd4;
    position: absolute;
    bottom: 0;
    transition: height 0.5s ease-in-out;
  }
  
  .tank-outline {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    border: 2px solid #0984e3;
    border-radius: 10px;
    pointer-events: none;
  }
  
  h4 {
    font-size: 1.5rem;
    color: #0984e3;
    margin-top: 15px;
  }
  
  /* Pump Control Buttons */
  .controls .button-group {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  button {
    font-size: 16px;
    padding: 12px 25px;
    border: 2px solid #0984e3;
    border-radius: 8px;
    background: transparent;
    color: #0984e3;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
  }
  
  button:hover {
    opacity: 0.95;
    transform: translateY(-1px);
    background: #0984e3;
    color: white;
  }
  
  button:active {
    transform: translateY(1px);
  }
  
  button:focus {
    outline: none;
    box-shadow: 0 0 4px rgba(52, 152, 219, 0.4);
  }
  
  button.ghost {
    background: transparent;
    border: 2px solid #0984e3;
    color: #0984e3;
  }
  
  button.ghost:hover {
    background: #0984e3;
    color: white;
  }
  
  button.ghost:active {
    background: #74b9ff;
    border-color: #74b9ff;
  }
  
  button.ghost:focus {
    box-shadow: 0 0 4px rgba(52, 152, 219, 0.4);
  }
  
  /* Auto Settings */
  .auto-settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
  }
  
  .auto-settings label {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  
  .auto-settings input {
    width: 120px;
    padding: 8px;
    font-size: 1rem;
    border: 2px solid #0984e3;
    border-radius: 8px;
    text-align: center;
  }
  
  /* Status Text */
  .status-text {
    margin-top: 20px;
    font-size: 1.2rem;
  }
  
  .text-success {
    color: #2ecc71;
  }
  
  .text-danger {
    color: #e74c3c;
  }
  
  /* Table Styles */
  .table {
    width: 100%;
    margin-top: 30px;
    border-collapse: collapse;
    background-color: #fff;
  }
  
  .table th, .table td {
    padding: 12px;
    text-align: left;
    border: 1px solid #ddd;
  }
  
  .table-striped tbody tr:nth-child(odd) {
    background-color: #f9f9f9;
  }
  
  .table th {
    background-color: #0984e3;
    color: white;
  }
  
  .table td {
    font-size: 1rem;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .water-tank {
      width: 80px;
      height: 180px;
    }
  
    h4 {
      font-size: 1.2rem;
    }
  
    .controls .button-group {
      flex-direction: column;
    }
  
    .auto-settings input {
      width: 100px;
    }
  }
  </style>
  
