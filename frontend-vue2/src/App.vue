<template>
  <div id="app" class="d-flex flex-column h-100">
    <dashboard msg="ABC Cloud Monitoring Dashboard" />
    <div class="container flex-grow-1">
      <error />
    </div>
  </div>
</template>

<script>
import Dashboard from "./views/Dashboard.vue";
import Error from "./components/Error.vue";

export default {
  name: "App",
  components: {
    Dashboard,
    Error,
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
