"use strict";

const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const http = require("http");
const methodOverride = require("method-override");
const oas3Tools = require("oas3-tools");
const path = require("path");
const rTracer = require("cls-rtracer");
const timeout = require("connect-timeout");
const yaml = require("js-yaml");

const logger = require("./utils/log");
const dbUtil = require("./utils/db");
const secuUtil = require("./utils/security");

// Setup configuration
const conf = yaml.load(fs.readFileSync(__dirname + "/config.yml", "utf8"), {
  json: true,
});
const environment = process.env.NODE_ENV || "LOC";
const mode = Object.assign({}, conf.DEV, conf[environment]);
mode.RENV = environment;

// Setup domain info
const subdomain = mode.CLIENT.split("/")[1].toLowerCase();
logger.setupDomain(subdomain);
logger.warn("MAIN", "$ Runtime mode : " + environment);

// Setup log level
logger.setupLevel(
  mode.DEBUG == true ? "debug" : environment == "OPS" ? "warn" : "info"
);
logger.warn("MAIN", "$ Log level : " + logger.getLevel());

// Setup db client
dbUtil.initRedisClient({
  host: mode.REDIS_HOST,
  port: mode.REDIS_PORT,
  auth: mode.REDIS_AUTH,
});

// Configure Swagger UI
const swaggerOptions = {
  controllers: path.join(__dirname, "./controllers"),
};
const expressAppConfig = oas3Tools.expressAppConfig(
  path.join(__dirname, "./openapi.yml"),
  swaggerOptions
);
expressAppConfig.addValidator();

// Define express application
const app = expressAppConfig.getApp();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());
app.use(compression());
app.use(timeout("10s"));
app.use(rTracer.expressMiddleware());
app.use(express.static(path.join(__dirname, "/static")));

// Define exceptional urls
const routeIgnore = ["link", "api-docs"];

const showReqData = (reqObj) => {
  let reqData = "";
  Object.keys(reqObj).forEach((key) => {
    const val =
      typeof reqObj[key] == "object"
        ? JSON.stringify(reqObj[key])
        : reqObj[key];
    reqData += key + " : " + val + ", ";
  });
  reqData = reqData.substring(0, reqData.length - 2);
  return reqData;
};

app.use((req, res, next) => {
  // Check session renewal
  logger.setupSession(rTracer.id());
  logger.warn(
    "REQUEST",
    `$ session id.c : ${logger.getSession()} | ${req.path}`
  );

  // Default routing guide
  if (req.path.trim() == "" || req.path.trim() == "/") {
    const guides = {
      swaggerUI: `http://localhost:${mode.LOCAL_PORT}/docs`,
      webSocket: `http://localhost:${mode.LOCAL_PORT}/wstc`,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(guides, null, 2));
    return;
  }

  // Bypass on specific routes
  for (let i = 0; i < routeIgnore.length; i++) {
    const currUrl = routeIgnore[i];
    if (req.url.indexOf(currUrl) != -1) {
      logger.warn(
        "REQUEST",
        `$ bypass.w : ${req.url}, ${JSON.stringify(req.query)}`
      );
      next();
      return;
    }
  }

  // Verify authorization token
  const authToken = req.headers["Authorization"];
  if (authToken && authToken.startsWith("Bearer")) {
    const tokenVal = authToken.split("Bearer ")[1];
    secuUtil.verifyToken(tokenVal, mode.JWT_SECRET).then((res) => {
      if (!res && !res.result) {
        logger.warn("REQUEST", `$ unauthorized.w : ${JSON.stringify(res)}`);
        next();
        return;
      }
    });
  }

  // Setup global configurations
  req.renv = environment;
  req.mode = mode;

  // Check request data on basic fields
  const reqData = [
    Object.keys(req.params).length > 0 ? Object.keys(req.params) : undefined,
    Object.keys(req.query).length > 0 ? Object.keys(req.query) : undefined,
    Object.keys(req.body).length > 0 ? Object.keys(req.body) : undefined,
  ];
  const reqScheme = `${req.method} | ${req.path}`;
  const reqPath = `${
    reqData[0]
      ? Object.keys(req.params).length == 1
        ? reqData[0] + " : " + req.params[reqData[0]]
        : showReqData(req.params)
      : "no data"
  }`;
  const reqQuery = `${
    reqData[1]
      ? Object.keys(req.query).length == 1
        ? reqData[1] + " : " + req.query[reqData[1]]
        : showReqData(req.query)
      : "no data"
  }`;
  const reqBody = `${
    reqData[2]
      ? new String(JSON.stringify(reqData[2])).length > 5120
        ? new String(JSON.stringify(reqData[2])).length + " bytes"
        : showReqData(req.body)
      : "no data"
  }`;
  const reqCondition = `${reqScheme} | ${reqPath} | ${reqQuery} | ${reqBody}`;
  logger.warn("REQUEST", reqCondition);

  req.forms = JSON.parse(JSON.stringify(req.body));
  logger.info("REQUEST", `! body: ${JSON.stringify(req.forms)}`);

  res.on("finish", () => {
    logger.info(
      "RESPONSE",
      `! statusCode: ${res.statusCode} | ${res.statusMessage}`
    );
    const resStatus = `${res.statusCode} | ${res.statusMessage}`;
    const resBody =
      typeof res.payload == "object" && "data" in res.payload
        ? res.payload.data
        : "";
    const resArr = Array.isArray(resBody);
    const resSize = `${
      resArr
        ? resBody.length
        : typeof res.payload == "object" || res.payload > 0
        ? 1
        : 0
    }`;
    const resData = resBody != "" ? JSON.stringify(res.payload) : "-";

    switch (res.statusCode.toString().charAt(0)) {
      case "5":
        logger.error("RESPONSE", `${reqScheme} | ${resStatus}`);
        break;
      case "4":
        logger.warn("RESPONSE", `${reqScheme} | ${resStatus}`);
        break;
      default:
        const resSizeBytes = new String(resData).length;
        const resFinal =
          resSizeBytes > 5120 ? resSizeBytes + " bytes" : resData;
        const rd2 = resArr && resArr == true ? "-" : resFinal;
        logger.warn(
          "RESPONSE",
          `${reqScheme} | ${resStatus} | ${resSize} | ${rd2}`
        );
        break;
    }
  });

  next();
});

// Setup server push service
const pushSvc = require("./push");
if (mode.PUSH) {
  pushSvc.initialize(mode).then((res) => {
    logger.warn("MAIN", `$ pushSvc (${res.name}) ready!`);

    // Setup periodical batch service
    if (mode.BATCH) {
      const batchSvc = require("./batch");
      batchSvc.initialize(mode, pushSvc);
    }
  });
}

// Launch swagger middleware
const serverPort = process.env.PORT || mode.LOCAL_PORT;
http.createServer(app).listen(serverPort, () => {
  logger.warn(
    "MAIN",
    `$ Swagger UI is available on http://localhost:${serverPort}/docs`
  );
});
