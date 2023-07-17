export default {
  _log: (message, prefix) => console.log(`%s ${message}`, prefix),
  done: function (message) {
    this._log(message, '\x1b[32m\x1b[01mDONE \x1b[0m');
  },
  error: function (message) {
    this._log(message, '\x1b[31m\x1b[01mERROR \x1b[0m');
  },
  warning: function (message) {
    this._log(message, '\x1b[33m\x1b[01mWARNING \x1b[0m');
  },
  yellow: function (message) {
    this._log(`\x1b[33m${message}\x1b[0m`);
  },
  info: function (message) {
    this._log(message, '\x1b[34m\x1b[01mINFO \x1b[0m');
  },
};
