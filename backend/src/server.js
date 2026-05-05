const { app, start, __internals } = require("./app");

if (require.main === module) {
  start();
}

module.exports = {
  app,
  start,
  __internals
};
