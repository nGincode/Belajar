const client = require("prom-client");

const monitor_count_request = new client.Counter({
  name: "api_count_request",
  help: "this is the metric for getting requiest data based on code status",
  labelNames: ["path", "method", "status"],
});

const monitor_response_time = new client.Gauge({
  name: "api_response_time",
  help: "this is the metric to get response time data based on request",
  labelNames: ["path", "method", "status"],
});

const register = new client.Registry();

const createMetric = async () => {
  register.setDefaultLabels({ app: "api_app_1" });
  client.collectDefaultMetrics({ register });
  register.registerMetric(monitor_count_request);
  register.registerMetric(monitor_response_time);
};

// group route
// check if route have query param
const getRoutesMonitoring = (endpoint) => {
  return endpoint.split("?")[0];
};

module.exports = {
  monitor_count_request,
  monitor_response_time,
  createMetric,
  register,
  getRoutesMonitoring,
};
