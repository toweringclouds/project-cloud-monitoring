"use strict";

const redis = require("redis");

const logger = require("./log");

let dbConf = { redis: null };
let redisClient = null;

function $() {}

$.initRedisClient = (opt) => {
  dbConf.redis = opt;
  logger.info("UTIL", `! db.redis.i : ${JSON.stringify(dbConf.redis)}`);

  try {
    redisClient = redis.createClient({
      host: opt.host,
      port: opt.port,
      password: opt.auth,
      socket_keepalive: true,
    });
    logger.debug(
      "UTIL",
      "# db.redis.c : redis client info - " + redisClient.address
    );
    logger.warn(
      "UTIL",
      `$ db.redis.o : connected to redis server on port ${opt.port}`
    );
    return redisClient;
  } catch (ex) {
    logger.warn("UTIL", `$ db.redis.w : ${ex}`);
    return null;
  }
};

$.getRedisClient = (idx) => {
  return new Promise((resolve, reject) => {
    try {
      if (!redisClient) redisClient = $.initRedisClient(dbConf.redis);
      const dbIdx = idx ? idx : 0;

      redisClient.select(dbIdx, (err) => {
        if (err) {
          logger.error(
            "UTIL",
            `@ db.redis.e : failed to select db-${dbIdx} /w ${err}`
          );
          return reject();
        }
        logger.info("UTIL", `! db.redis.c : db-${dbIdx} selected`);
        resolve(redisClient);
      });
    } catch (ex) {
      logger.warn("UTIL", `$ db.redis.w : ${ex}`);
      resolve(null);
    }
  });
};

module.exports = $;
