"use strict";

const jwt = require("jsonwebtoken");
const utf8 = require("utf8");

const logger = require("./log");

function $() {}

$.encB = (ori) => {
  const encBuf = Buffer.from(ori);
  return encBuf.toString("base64");
};

$.decB = (enc) => {
  const decBuf = Buffer.from(enc, "base64");
  return decBuf.toString("binary");
};

$.encU = (ori) => {
  return utf8.encode(ori);
};

$.decU = (enc) => {
  return utf8.decode(enc);
};

$.encUB = (ori) => {
  const encU8 = utf8.encode(ori);
  const encBuf = Buffer.from(encU8);
  return encBuf.toString("base64");
};

$.decUB = (enc) => {
  const decBuf = Buffer.from(enc, "base64");
  const decAsc = decBuf.toString("ascii");
  return utf8.decode(decAsc);
};

$.signToken = (key, val, expireAfter = "99999d") => {
  return new Promise((resolve, reject) => {
    try {
      logger.info("UTIL", `! signToken.i : ${key} | ${val}`);

      jwt.sign(
        { val },
        key,
        { expiresIn: expireAfter, algorithm: "HS256" },
        (err, encoded) => {
          if (err) {
            logger.warn("UTIL", "$ signToken.w : " + err);
            return resolve({ result: false, data: err });
          }
          logger.info("UTIL", "! signToken.o : " + encoded);
          resolve({
            result: true,
            data: {
              val,
              accessToken: encoded,
            },
          });
        }
      );
    } catch (ex) {
      logger.error("UTIL", `@ signToken.e : ${ex}`);
      reject(ex);
    }
  });
};

$.verifyToken = (key, val) => {
  return new Promise((resolve, reject) => {
    try {
      logger.info("UTIL", `! verifyToken.i : ${key} | ${val}`);

      jwt.verify(val, key, (err, decoded) => {
        if (err) {
          logger.warn("UTIL", "$ verifyToken.w : " + err);
          return resolve({ result: false, data: err });
        }
        logger.info("UTIL", "! verifyToken.o : " + decoded);
        resolve({ result: true, data: decoded });
      });
    } catch (ex) {
      logger.error("UTIL", `@ verifyToken.e : ${ex}`);
      reject(ex);
    }
  });
};

module.exports = $;
