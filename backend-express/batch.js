"use strict";

const moment = require("moment");
const schedule = require("node-schedule");
const { v4: uuidv4 } = require("uuid");

const logger = require("./utils/log");

let jobs = [];
let webSocket;
let subDomain;

function $() {}

$.initialize = (_mode, _ws) => {
  logger.setupSession("????????-????-????-????-????????????");
  subDomain = _mode.CLIENT.split("/")[1].toLowerCase();
  logger.info("BATCH", `! initialize.i : ${subDomain}`);
  webSocket = _ws;
  webSocket.broadcast({ hello: "websocket test by batch service" });

  // register batch jobs
  setup(_mode).then((res) => {
    logger.info(
      "BATCH",
      `! initialize.o : ${res.length} job(s) ready to execute!`
    );
  });
};

const setup = (_mode) => {
  return new Promise((resolve, reject) => {
    jobs.push(
      schedule.scheduleJob("0 */1 * * * *", () => {
        logger.setupSession(uuidv4());
        logger.info(
          "BATCH",
          `! setup.c : 1st job executed at ${moment().format(
            "YYYY-MM-DDTHH:mm:ss.SSS"
          )}!`
        );
      })
    );
    resolve(jobs);
  });
};

module.exports = $;
