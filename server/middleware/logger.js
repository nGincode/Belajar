const winston = require("winston");
const expressWinston = require("express-winston");
const moment = require("moment");
const winstonLog = require("../config/loki");

const {
  getRoutesMonitoring,
  monitor_count_request,
  monitor_response_time,
} = require("../config/prometheus");
require("winston-daily-rotate-file");

const request = () => {
  const DailyRotateFileConf = {
    filename: `./logs/%DATE%.log`,
    datePattern: "YYYY/MM/DD",
    zippedArchive: true,
    frequency: "24h",
    maxFiles: "30d",
  };

  if (
    !require("fs").existsSync(
      DailyRotateFileConf.filename.replace("%DATE%.log", "") +
        moment().format("YYYY/MM")
    )
  ) {
    require("fs").mkdirSync(
      DailyRotateFileConf.filename.replace("%DATE%.log", "") +
        moment().format("YYYY/MM"),
      { recursive: true }
    );
  }

  return expressWinston.logger({
    meta: true,
    skip: function (req, res) {
      if (req.url?.split("/")?.[1] == "api") {
        return false;
      } else {
        return true;
      }
    },
    transports: [
      new winston.transports.DailyRotateFile(DailyRotateFileConf),
      // new winston.transports.Console({
      //   json: true,
      //   colorize: true,
      // }),
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf((info) => {
        var arr = [];
        arr.push(moment().format("YYYY-MM-DD HH:mm:ss.SSS")); //! Timestamp
        arr.push(info.meta.req.headers.idReq); //! ID
        arr.push("REQ"); //! Name
        arr.push(info.meta.req.method); //! Method
        arr.push(info.meta.req.url); //! Url
        arr.push(JSON.stringify(info.meta.req.headers)); //! Headers
        arr.push(JSON.stringify(info.meta.req.body)); //! Request Body

        return arr.join(" | ");
      })
    ),
    requestWhitelist: ["body", "url", "headers", "method", "ip", "idReq"],
    responseWhitelist: ["body"],
  });
};

const response = () => {
  return expressWinston.logger({
    meta: true,
    skip: function (req, res) {
      if (req.url?.split("/")?.[1] == "api") {
        return false;
      } else {
        return true;
      }
    },
    transports: [
      new winston.transports.DailyRotateFile({
        filename: "./logs/%DATE%.log",
        datePattern: "YYYY/MM/DD",
        zippedArchive: true,
        frequency: "24h",
        maxFiles: "30d",
      }),
      //  new winston.transports.Console({
      //    json: true,
      //    colorize: true,
      //  }),
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf((info) => {
        var arr = [];
        arr.push(moment().format("YYYY-MM-DD HH:mm:ss.SSS")); //! Timestamp
        arr.push(info.meta.req.headers.idReq); //! ID
        arr.push("RES"); //! Name
        arr.push(info.meta.req.method); //! Method
        arr.push(info.meta.req.ip); //! Remote Address
        arr.push(info.meta.req.url); //! Url
        arr.push(info.meta.responseTime); //! Response Time
        arr.push(JSON.stringify(info.meta.res.body)); //! Headers

        var routes_name = getRoutesMonitoring(info.meta.req.url);
        if (routes_name.match("/api/v1/") != null) {
          var type_routes = "app1";
        } else {
          var type_routes = "app1";
        }

        // insert data prometheus
        monitor_count_request
          .labels({
            path: routes_name,
            method: info.meta.req.method,
            status: info.meta.res.statusCode,
          })
          .inc(1);

        monitor_response_time
          .labels({
            path: routes_name,
            method: info.meta.req.method,
            status: info.meta.res.statusCode,
          })
          .set(info.meta.responseTime);

        var message = JSON.stringify(info.meta.res.body);
        winstonLog.log.info({
          responseTime: info.meta.responseTime,
          message: message,
          labels: {
            path: routes_name,
            status_code: info.meta.res.statusCode,
            method: info.meta.req.method,
          },
        });

        return arr.join(" | ");
      })
    ),
    requestWhitelist: [
      ...expressWinston.requestWhitelist,
      "body",
      "url",
      "headers",
      "method",
      "ip",
    ],
    responseWhitelist: [...expressWinston.responseWhitelist, "body"],
  });
};

module.exports = { request: request(), response: response() };
