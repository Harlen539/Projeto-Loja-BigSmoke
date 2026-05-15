const { start } = require("./app");

if (require.main === module) {
  const PORT = Number(process.env.PORT || 3000);
  start(PORT);
}

module.exports = {
  start
};
