"use strict";

exports.getItems = () => {
  return {
    dev: {
      "cb-wapi": {
        use: true,
        cloud: true,
        ip: "?.?.?.?",
        port: 57791,
        role: "web api",
      },
      "cf-wui": {
        use: true,
        cloud: true,
        ip: "?.?.?.?",
        port: 57203,
        role: "web ui",
      },
      "db-redis": {
        use: true,
        cloud: true,
        ip: "?.?.?.?",
        port: 35373,
        role: "cache db",
      },
      "gw-nginx": {
        use: true,
        cloud: true,
        iip: "?.?.?.?",
        port: 443,
        role: "proxy gw",
      },
    },
  };
};
