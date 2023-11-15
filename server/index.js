const express = require("express");
const server = express();
const routes = require("./routes/index");
const next = require("next");
const cors = require("cors");
const logger = require("morgan");
const path = require("path");
const uuid = require("uuid");
const dotenv = require("dotenv").config();

const Logger = require("./middleware/logger");
const { register, createMetric } = require("./config/prometheus");

const dev = !process.env.DEV ? false : true;
const hostname = dotenv.parsed.HOSTNAME;
const port = dotenv.parsed.PORT;
const app = next({ dev, hostname, port });

const handle = app.getRequestHandler();

app.prepare().then(() => {
  server.use(logger("dev"));
  server.use(cors({ origin: true }));
  server.use(express.static(path.join(__dirname, "../public")));
  server.use(express.json({ limit: "50mb" }));
  server.use(express.urlencoded({ limit: "50mb", extended: true }));

  const originalSend = server.response.send;
  server.response.send = function sendOverWrite(body) {
    originalSend.call(this, body);
    this.__custombody__ = body;
  };
  server.use((req, res, next) => {
    req.headers.idReq = uuid.v4();
    next();
  });

  // create metric prometheus
  createMetric();
  server.get("/metrics", (req, res) => {
    res.setHeader("Content-Type", register.contentType);
    register.metrics().then((data) => res.send(data));
  });

  server.use(Logger.request);
  server.use(Logger.response);

  server.use("/api", routes);

  server.get("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `> Ready on ${
        dev ? "Development" : "Production"
      } http://${hostname}:${port}`
    );
  });
});
