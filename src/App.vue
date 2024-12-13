<template>
  <div id="app">
    <WebApp />
  </div>
</template>

<script>
import WebApp from './components/WebApp.vue'; // Ensure the file path and name are correct

export default {
  name: 'App',
  components: {
    WebApp,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
