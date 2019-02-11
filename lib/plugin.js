/**
 * plugin.js
 */

const util = require("util");
const qr = require("querystring");
const ut = require("./utils");

module.exports = {
  params: {
    host: "192.168.0.14",
    port: 7999,
    lport: 8999
  },

  doCmd: "",

  setParams(obj) {
    if (typeof obj == "object") {
      Object.keys(obj).forEach(param => {
        if (this.params[param] != undefined) this.params[param] = obj[param];
      });
      this.doCmd = ut.doSubstitute(this.params.cmdreq);
    }
  },

  config: [],
  reqarr: [],
  extra: [],
  setExtra(arr) {
    if (arr && util.isArray(arr)) this.extra = arr;
  }

}