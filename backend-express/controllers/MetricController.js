"use strict";

const errFilter = require("../utils/error");
const logger = require("../utils/log");
const resUtil = require("../utils/writer");

const metricService = require("../services/MetricService");

/**
 * [R] search metric list
 */
module.exports.searchMetrics = (req, res, next) => {
  const metric = {
    metricType: req.query["metricType"],
    locationIn: req.mode.LOCATION === "I" ? true : false,
  };
  logger.info("ROUTE", "! findMetric.i : " + JSON.stringify(metric));

  metricService
    .readMetric(metric)
    .then((r1) => {
      logger.info(
        "ROUTE",
        "! findMetric.o : " + JSON.stringify(Object.keys(r1.data).length)
      );
      res.payload = r1;
      resUtil.writeJson(res, r1);
    })
    .catch((e1) => {
      logger.error("ROUTE", "@ findMetric.e : " + JSON.stringify(e1));
      const resErr = errFilter.getErrData(e1);
      res.payload = {
        result: false,
        data: { code: "UR00", message: resErr[1] },
      };
      resUtil.writeJson(res, res.payload, resErr[0]);
    });
};
