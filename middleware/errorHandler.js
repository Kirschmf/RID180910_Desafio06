const responseHelper = require("../utils/responseHelper")

const errorHandler = (err, req, res, next) => {
  console.error("❌ Erro capturado:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  // Erro de validação do Joi
  if (err.isJoi) {
    const errors = err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }))
    return res.status(400).json(responseHelper.error("Dados inválidos", 400, errors))
  }

  // Erro de MySQL
  if (err.code) {
    switch (err.code) {
      case "ER_DUP_ENTRY":
        return res.status(409).json(responseHelper.error("Registro duplicado", 409))
      case "ER_NO_REFERENCED_ROW_2":
        return res.status(400).json(responseHelper.error("Referência inválida", 400))
      case "ECONNREFUSED":
        return res.status(503).json(responseHelper.error("Erro de conexão com banco de dados", 503))
      case "ER_ACCESS_DENIED_ERROR":
        return res.status(503).json(responseHelper.error("Erro de autenticação no banco de dados", 503))
      default:
        console.error("Erro MySQL não tratado:", err.code, err.message)
    }
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json(responseHelper.error("JSON inválido", 400))
  }

  // Erro genérico
  const statusCode = err.statusCode || err.status || 500
  const message = process.env.NODE_ENV === "production" ? "Erro interno do servidor" : err.message

  res.status(statusCode).json(responseHelper.error(message, statusCode))
}

module.exports = errorHandler
