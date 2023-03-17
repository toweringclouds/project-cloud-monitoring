const isPortReachable = require("is-port-reachable");
const moment = require("moment");

const App = require("../models/Applications.js");
const Svr = require("../models/Servers.js");

const isPortAlive = (_div, _env) => {
  const getTargets = (_renv, _data) => {
    console.log(
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
    console.log(`! getTargets.o : ${JSON.stringify(result)}`);
    return result;
  };

  const checkPortAlive = (_renv, _data) => {
    console.log(`! checkPortAlive.i.${_renv} : ${Object.keys(_data).length}`);

    return new Promise(async (resolve, reject) => {
      try {
        const target = getTargets(_renv, _data);
        if (!target) {
          const warnMsg = `No targets available on ${_renv}-runtime.`;
          console.log(`$ checkPortAlive.w : ${warnMsg}`);
          return reject(`No targets available on ${_renv}-runtime.`);
        }
        console.log(`# checkPortAlive.c.${_renv} : ${JSON.stringify(target)}`);

        const result = {};
        for (const item of Object.keys(target)) {
          if (target[item].use === true) {
            result[item] = await isPortReachable(target[item].port, {
              host: target[item].ip,
            });
          }
        }
        console.log(`! checkPortAlive.o.${_renv} : ${JSON.stringify(result)}`);
        resolve(result);
      } catch (ex) {
        console.log(`@ checkPortAlive.e : ${ex}`);
        reject(ex);
      }
    });
  };

  const what = _div.toLowerCase() == "svr" ? Svr.getItems() : App.getItems();
  return checkPortAlive(_env, what).then((r1) => {
    console.log(
      `! isPortAlive.i.${_env} : ${JSON.stringify(r1)} | ${
        Object.keys(what[_env]).length
      }`
    );

    Object.keys(what[_env]).map((item) => {
      what[_env][item].alive = r1[item] || false;
      what[_env][item].aliveAt = moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
      what[_env][item].aliveTime = Date.now();
    });
    console.log(`! isPortAlive.o.${_env} : ${JSON.stringify(what[_env])}`);
    return what[_env];
  });
};

const showResult = (_div) => {
  const aliveCheck = (_env) => {
    return new Promise((resolve, reject) => {
      let checkResult = {};

      isPortAlive(_div, _env)
        .then((res) => {
          checkResult[_env] = res;
          Object.keys(checkResult[_env]).map((item) => {
            checkResult[_env][item].div = _env;
          });
          console.log(
            `! aliveCheck.c.${_env} : ${JSON.stringify(checkResult[_env])}`
          );
          resolve(checkResult[_env]);
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
    console.log(`! isPortAlive.i : ${jobs.length}`);
    console.log(`! isPortAlive.c : ${data.length} | ${JSON.stringify(data)}`);

    let targetHosts = {};
    data.map((items) => {
      Object.keys(items).map((key) => {
        targetHosts[key] = items[key];
      });
    });
    console.log(
      `! isPortAlive.o : ${Object.keys(targetHosts).length} | ${JSON.stringify(
        targetHosts
      )}`
    );
    return targetHosts;
  });
};

const args = process.argv.slice(2);
if (args.length != 2) {
  console.log("usage) node test.js {div} {env}");
  console.log("       - div : check target");
  console.log("         - svr : server");
  console.log("         - app : application");
  console.log("       - env : runtime environment");
  console.log("         - dev : development");
  console.log("         - stg : staging");
  console.log("         - ops : operation");
  return;
}

if (["svr", "app"].find((i) => i == args[0].toLowerCase()) == undefined) {
  console.log(`$ div (${args[0]}) not supported!\n`);
  return;
}

if (
  ["all", "dev", "stg", "ops", "tst"].find((i) => i == args[1].toLowerCase()) ==
  undefined
) {
  console.log(`$ env (${args[1]}) not supported!\n`);
  return;
}

if (args[1] != "all") {
  isPortAlive(args[0], args[1]);
} else {
  showResult(args[0]);
}
