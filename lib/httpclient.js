/**
 * httpclient.js
 */

const util = require("util");
const http = require("http");
const net = require("net");

exports.httpGet = httpGet;
exports.SocketDataExchange = SocketDataExchange;

function httpGet({ host, port, url, adr, stopOnError }, logger, callback) {
  logger.log("", "client");
  httpClientLog("=>", host, "HTTP GET " + url);

  try {
    const req = http
      .get({ host, port, path: url, agent: false }, res => {
        httpClientLog("<=", host, resStatus(res));

        let body = "";
        if (res.statusCode != 200) {
          res.resume();
          return;
        }

        res.on("data", chunk => {
          body += chunk;
        });

        res.on("end", () => {
          logger.log(" body: " + String(body), "client");
          if (callback) callback(body);
        });
      })
      .on("error", e => {
        errorhandler(e);
      });
    req.on("socket", socket => {
      socket.setTimeout(30000);
      socket.on("timeout", () => {
        httpClientLog("<=>", host, "Socket timed out - abort!");
        req.abort();
      });

      socket.on("close", () => {
        logger.log("localhost <=>" + host + " socket closed", "socket");
      });
    });
  } catch (e) {
    logger.log("Http request error: " + e.message);
  }

  function errorhandler(e) {
    let mess = "Error " + e.code + ". ";
    let result = 3;

    if (e.code == "ECONNREFUSED") {
      mess += " Connection error. ";
      result = 2;
    }
    if (stopOnError) {
      httpClientLog("<=", host, mess + " Stopped.");
      process.exit(result);
    } else {
      httpClientLog("<=", host, mess);
    }
  }

  function resStatus(res) {
    let mess =
      res.statusCode == 200
        ? " contentType = " + res.headers["content-type"]
        : "";
    return " response: statusCode=" + res.statusCode + mess;
  }

  function httpClientLog(dir, chost, msg) {
    logger.log("localhost " + dir + " " + chost + " " + msg, "client");
  }
}

function SocketDataExchange({ host, port, url, adr, stopOnError }, logger, callback) {
  //Подключиться, создать клиента
  const client = net.createConnection({host, port}, () => {
    logger.log("connection by socket to the " +host+ ":" +port+ " successfull!");
  });

  //В случае ошибки завершить соединение и вывести лог
  client.on("error", e => {
    client.end();
    logger.log("connection by socket to the " +host+ ":" +port+ " is failed! Error - " +e.code);
    //process.exit(1);
  });

  //TCP сокет позволяет отправлять и получать сообщения после установки соединения
  //Отправка данных: 
  client.write(url, () => {
    logger.log("send data by socket - " +util.inspect(url));
    client.end();
    logger.log("connection by socket to the " +host+ ":" +port+ " is end!");
  });

  //Прием данных: 
  //client.on("data", data => {
  //  SocketClientLog("<=", host+ ":" +port, "data - " +data);
  //  client.end();
  //});

  //Функция для более очевидного логирования
  function SocketClientLog(dir, chost, msg) {
    logger.log("localhost " + dir + " " + chost + " " + msg, "client");
  }
}