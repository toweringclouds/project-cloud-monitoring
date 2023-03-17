"use strict";

const async = require("async");
const isPortReachable = require("is-port-reachable");
const moment = require("moment");

const dbUtil = require("../utils/db");
const logger = require("../utils/log");

const App = require("../models/Applications.js");
const Svr = require("../models/Servers.js");

/**
 * find metric matching metricId
 *
 * p_in : metric id
 * returns metric object
 **/
exports.readMetric = (p_in) => {
  return new Promise((resolve, reject) => {
    logger.info("LOGIC", "! readMetric.i : " + JSON.stringify(p_in));

    const isPortAlive = (_env, _div, _opt) => {
      logger.info("LOGIC", `! isPortAlive.i : ${_env} | ${_div} | ${_opt}`);

      if (["S", "A"].find((i) => i == _div) == undefined) {
        const warnMsg = `div (${_div}) not supported!`;
        logger.warn("LOGIC", `$ isPortAlive.w1 : ${warnMsg}`);
        return { result: false, data: warnMsg };
      }

      if (["dev", "stg", "ops", "tst"].find((i) => i == _env) == undefined) {
        const warnMsg = `env (${_env}) not supported!`;
        logger.warn("LOGIC", `$ isPortAlive.w2 : ${warnMsg}`);
        return { result: false, data: warnMsg };
      }

      const getTargets = (_renv, _data) => {
        logger.info(
          "LOGIC",
          `! getTargets.i : ${_renv} | ${JSON.stringify(Object.keys(_data))}`
        );

        let result = null;
        switch (_renv.charAt(0).toLowerCase()) {
          case "o":
            result = _data.ops;
            break;
          case "s":
            result = _data.stg;
            break;
          case "d":
            result = _data.dev;
            break;
          default:
            result = _data.tst;
            break;
        }
        logger.info("LOGIC", `! getTargets.o : ${JSON.stringify(result)}`);
        return result;
      };

      const checkPortAlive = (_renv, _data) => {
        logger.info(
          "LOGIC",
          `! checkPortAlive.i.${_renv} : ${Object.keys(_data).length}`
        );

        return new Promise(async (resolve, reject) => {
          try {
            const target = getTargets(_renv, _data);
            if (!target) {
              const warnMsg = `No targets available on ${_renv}-runtime.`;
              logger.info("LOGIC", `$ checkPortAlive.w : ${warnMsg}`);
              return reject(`No targets available on ${_renv}-runtime.`);
            }

            const result = {};
            for (const item of Object.keys(target)) {
              if (target[item].use === true) {
                const addr =
                  _opt === true
                    ? [target[item].ip, target[item].port]
                    : [target[item].ip2, target[item].port2];

                result[item] = await isPortReachable(addr[1], {
                  host: addr[0],
                });
              }
            }
            logger.info(
              "LOGIC",
              `! checkPortAlive.o.${_renv} : ${JSON.stringify(result)}`
            );
            resolve(result);
          } catch (ex) {
            logger.error("LOGIC", `@ checkPortAlive.e : ${ex}`);
            reject(ex);
          }
        });
      };

      const what = _div === "S" ? Svr.getItems() : App.getItems();
      return checkPortAlive(_env, what).then((r1) => {
        logger.info(
          "LOGIC",
          `! isPortAlive.c.${_env} : ${JSON.stringify(r1)} | ${
            Object.keys(what[_env]).length
          }`
        );

        Object.keys(what[_env]).map((item) => {
          what[_env][item].alive = r1[item] || false;
          what[_env][item].aliveAt = moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
          what[_env][item].aliveTime = Date.now();
        });

        logger.info(
          "LOGIC",
          `! isPortAlive.o.${_env} : ${Object.keys(what[_env]).length}`
        );
        return what[_env];
      });
    };

    const showResult = (_div, _opt) => {
      logger.info("LOGIC", `! showResult.i : ${_div} | ${_opt}`);

      const aliveCheck = (_env) => {
        return new Promise((resolve, reject) => {
          const _ENV = _env.toLowerCase().trim();
          const _DIV = _div.toUpperCase().trim();
          let checkResult = {};

          isPortAlive(_ENV, _DIV, _opt)
            .then((res) => {
              checkResult[_ENV] = res;
              Object.keys(checkResult[_ENV]).map((item) => {
                checkResult[_ENV][item].div = _ENV;
              });
              resolve(checkResult[_ENV]);
            })
            .catch((err) => {
              reject(err);
            });
        });
      };

      const jobs = ["dev", "stg", "ops", "tst"].map((item) => {
        return aliveCheck(item);
      });

      return Promise.all(jobs).then((data) => {
        logger.info(
          "LOGIC",
          `! showResult.c : ${jobs.length} | ${data.length} | ${JSON.stringify(
            Object.keys(data).length
          )}`
        );

        let targetHosts = {};
        data.map((items) => {
          Object.keys(items).map((key) => {
            targetHosts[key] = items[key];
          });
        });

        logger.info(
          "LOGIC",
          `! showResult.o : ${Object.keys(targetHosts).length}`
        );
        return targetHosts;
      });
    };

    const selectMetric = (input, cbw) => {
      try {
        logger.info("LOGIC", "! selectMetric.i : " + JSON.stringify(input));

        showResult(input.metricType, input.locationIn)
          .then((res) => {
            logger.info(
              "LOGIC",
              `! selectMetric.o : ${Object.keys(res).length}`
            );
            return cbw(null, { result: true, data: res });
          })
          .catch((ex) => {
            logger.warn("LOGIC", "$ selectMetric.w : " + ex);
            return cbw(null, { result: false, data: ex });
          });
      } catch (ex) {
        logger.error("LOGIC", "@ selectMetric.e : " + ex.stack);
        return cbw(ex.stack);
      }
    };

    async.waterfall([(cbw) => selectMetric(p_in, cbw)], (err, res) => {
      if (err) {
        logger.error("LOGIC", "@ readMetric.e : " + JSON.stringify(err));
        return reject(err);
      }
      logger.info("LOGIC", `! readMetric.o : ${Object.keys(res.data).length}`);
      resolve(res);
    });
  });
};
