function errorHandler(err, _req, res, _next) {
  console.error("Erro não tratado:", err.message);
  res.status(500).json({ error: "Erro interno do servidor." });
}

module.exports = {
  errorHandler
};
