const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
require("dotenv").config()

const errorHandler = require("./middleware/errorHandler")
const responseHelper = require("./utils/responseHelper")

// Import routes
const produtosRoutes = require("./routes/produtos")
const clientesRoutes = require("./routes/clientes")
const pedidosRoutes = require("./routes/pedidos")
const vendasRoutes = require("./routes/vendas")
const estoqueRoutes = require("./routes/estoque")

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: responseHelper.error("Muitas tentativas. Tente novamente em 15 minutos.", 429),
})
app.use("/api/", limiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json(
    responseHelper.success(
      {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      },
      "Sistema funcionando corretamente",
    ),
  )
})

// API Routes
app.use("/api/produtos", produtosRoutes)
app.use("/api/clientes", clientesRoutes)
app.use("/api/pedidos", pedidosRoutes)
app.use("/api/vendas", vendasRoutes)
app.use("/api/estoque", estoqueRoutes)

// Root endpoint
app.get("/", (req, res) => {
  res.json(
    responseHelper.success(
      {
        name: "DNCommerce API",
        version: "1.0.0",
        description: "Sistema de E-commerce para Produtos de Beleza",
        endpoints: {
          health: "/api/health",
          produtos: "/api/produtos",
          clientes: "/api/clientes",
          pedidos: "/api/pedidos",
          vendas: "/api/vendas",
          estoque: "/api/estoque",
        },
      },
      "Bem-vindo ao DNCommerce API",
    ),
  )
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json(responseHelper.error("Endpoint não encontrado", 404))
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DNCommerce API rodando na porta ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📖 Documentação: http://localhost:${PORT}/`)
})

module.exports = app
