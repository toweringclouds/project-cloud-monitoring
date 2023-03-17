"use strict";

const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const logger = require("./utils/log");

// Define websocket domain
const rooms = ["room0", "room1", "room2", "room3"];
let namespace;
let uid = { default: "????????-????-????-????-????????????" };
let sid;
let ion;

function $() {}

$.initialize = (_mode) => {
  return new Promise((resolve, reject) => {
    const client = _mode.CLIENT.split("/");
    namespace = "/" + client[0].toLowerCase();
    logger.setupSession(uid.default);
    logger.info("PUSH", `! initialize.i : ${client[1].toLowerCase()}`);

    setup(_mode).then((res) => {
      logger.info("PUSH", `! initialize.o : ${res.name} websocket ready!`);
      resolve(ion);
    });
  });
};

const setup = (_mode) => {
  return new Promise((resolve, reject) => {
    // Create websocket server
    const ws = http.createServer();
    const io = socketio(ws, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    ion = io.of(namespace);
    logger.info("PUSH", `! initialize.i : ${ion.name}`);

    // Exchange messages via socket.io
    ion.on("connection", (socket) => {
      // Check session renewal
      sid = socket.id;
      uid[sid] = uuidv4();
      logger.setupSession(uid[sid]);
      logger.info(
        "PUSH",
        `! [${sid}] user connected at ${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}!`
      );

      // send a welcome message to the client
      socket.emit(rooms[1], `Welcome to new user (${sid})!`);

      // receive a message from the client
      socket.on(rooms[0], (data) => {
        logger.setupSession(uid[sid]);

        const current = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (data.div == "login") {
          const msg = {
            div: "login",
            who: "server",
            when: current,
            what: `${data.name} (${data.userid}) has joined!`,
          };
          socket.name = data.name;
          socket.userid = data.userid;
          logger.info("PUSH", `! client : ${JSON.stringify(msg)}`);
          ion.emit(rooms[3], JSON.stringify(msg));
        } else {
          const msg = {
            div: "chat",
            who: socket.name,
            when: current,
            what: data.msg,
          };
          logger.info("PUSH", `! client : ${JSON.stringify(msg)}`);
          socket.broadcast.emit(rooms[2], JSON.stringify(msg));
        }
      });

      // force client disconnect from server
      socket.on("forceDisconnect", () => {
        logger.setupSession(uid[sid]);
        logger.warn(
          "PUSH",
          `$ [${socket.id}] user forcely disconnected at ${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}!`
        );
        socket.disconnect();
      });

      socket.on("disconnect", () => {
        logger.setupSession(uid[sid]);
        logger.info(
          "PUSH",
          `! [${socket.id}] user disconnected at ${moment().format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          )}!`
        );
        delete uid[sid];
      });
    });

    // Initialize websocket server
    const wsPort = parseInt(_mode.LOCAL_PORT + 1);
    ws.listen(wsPort, () => {
      logger.setupSession(uid.default);
      logger.warn(
        "PUSH",
        `$ websocket service is available on ws://localhost:${wsPort}${namespace}`
      );
      logger.warn(
        "PUSH",
        `$ websocket test is available on http://localhost:${_mode.LOCAL_PORT}/wstc`
      );
    });
    resolve(ion);
  });
};

$.broadcast = (_event) => {
  const msg = JSON.stringify(_event);
  logger.setupSession(uid.default);
  logger.info(
    "PUSH",
    `! broadcast.c : ${msg} | ${JSON.stringify(Object.keys(uid))} | ${
      Object.keys(uid).length
    }`
  );
  ion.emit(rooms[3], msg);
};

module.exports = $;
