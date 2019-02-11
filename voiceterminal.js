/**
 * voiceterminal.js
 * Имя плагина - voiceterminal, манифест - voiceterminal.json
 */

const util = require("util");

const ut = require("./lib/utils");
const httpserver = require("./lib/httpserver");
const httpclient = require("./lib/httpclient");

const logger = require("./lib/logger");
const plugin = require("./lib/plugin");

let step = 0;
plugin.unitId = process.argv[2];

logger.log("VoiceTerminal plugin has started.", "start");
next();

function next() {
  switch (step) {
    case 0:
      // Запрос на получение параметров
      getTable("params");
      step = 1;

      break;

    case 1:
      // Запрос на получение списка входящих запросов
      getTable("extra");
      step = 2;
      break;

    case 2:
      // Запуск слушающего сервера
      httpserver.start(plugin, logger);
      step = 3;
      break;

    default:
  }
}

function getTable(name) {
  // process.send({ type: "get", tablename: name + "/" + plugin.unitId });
  process.send({ type: "get", tablename: name });
}

/**
 *  Интервальная функция выполняет запросы по массиву timers.
 *   timers упорядочен по .qtime
 *   В каждом цикле проверяется только первый элемент
 **/
function runOutReq() {
  let req = plugin.getNextReq();
 
  if (req) {
    httpclient.httpGet(req, logger, body => {
      body = String(body);
      if (body.indexOf("busy") >= 0) {
        plugin.resetTimer(req.index, 2); // Повторить через 2 сек
      } else {
        let payload;
        if (req.passBack) {
          // была отправлена команда - если получили 200 - можно установить значение
          payload = req.passBack;
        } else {
          // опрос
          payload = ut.parse(
            body,
            req.url,
            req.adr ? ut.portNumber(req.adr) : "",
            plugin.prefun,
            req.adr
          );
        }

        if (req.index >= 0) plugin.resetTimer(req.index);
        if (payload) plugin.processSendData(payload);
      }
    });
  }
}

/** ****************************** Входящие от IH ************************************/
process.on("message", message => {
  if (!message) return;

  if (typeof message == "string") {
    if (message == "SIGTERM") process.exit(0);
  }

  if (typeof message == "object") {
    try {
      if (message.type) parseMessageFromServer(message);
    } catch (e) {
      logger.log(e.message);
    }
  }
});

function parseMessageFromServer(message) {
  switch (message.type) {
    case "get":
      if (message.params) {
        plugin.setParams(message.params);
        if (message.params.debug) logger.setDebug(message.params.debug);
      }
      if (message.config) plugin.setConfig(message.config);
      if (message.extra) plugin.setExtra(message.extra);
      next();
      break;

    case "act":
      doAct(message.data);
      break;

    case "command":
      doCommand(message);
      break;

    case "debug":
      if (message.mode) logger.setDebug(message.mode);
      break;

    default:
  }
}

function doCommand(message) {
  logger.log("send command to terminal - " + util.inspect(message.command));
  if (!message.command) return;

  let command = message.command;

  httpclient.SocketDataExchange(
   {
     url: command,
     host: plugin.params.host,
     port: plugin.params.port,
     stopOnError: false
   },
     logger
  );
}


function doAct(data) {
  if (!data || !util.isArray(data) || data.length <= 0) return;

  // logger.log("act: " + util.inspect(data));
  data.forEach(item => {
    plugin.addAct(item);
  });
}

process.on("uncaughtException", err => {
  var text = "ERR (uncaughtException): " + util.inspect(err);
  logger.log(text);
});

process.on("disconnect", () => {
  process.exit();
});