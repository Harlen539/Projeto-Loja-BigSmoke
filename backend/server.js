const { start } = require("./src/app");

if (require.main === module) {
  start();
}

module.exports = {
  start
};
