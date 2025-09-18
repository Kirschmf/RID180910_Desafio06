const mysql = require("mysql2/promise")
const fs = require("fs").promises
const path = require("path")
require("dotenv").config()

async function setupDatabase() {
  let connection

  try {
    console.log("🔄 Iniciando configuração do banco de dados...")

    // Conectar ao MySQL (sem especificar database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    })

    console.log("✅ Conectado ao MySQL")

    // Ler e executar script de criação do schema
    const schemaPath = path.join(__dirname, "01-create-database-schema.sql")
    const schemaSQL = await fs.readFile(schemaPath, "utf8")

    console.log("🔄 Executando script de criação do schema...")
    await connection.execute(schemaSQL)
    console.log("✅ Schema criado com sucesso")

    // Ler e executar script de dados de exemplo
    const seedPath = path.join(__dirname, "02-seed-sample-data.sql")
    const seedSQL = await fs.readFile(seedPath, "utf8")

    console.log("🔄 Inserindo dados de exemplo...")
    await connection.execute(seedSQL)
    console.log("✅ Dados de exemplo inseridos")

    // Verificar se tudo foi criado corretamente
    await connection.execute("USE dncommerce")

    const [tables] = await connection.execute("SHOW TABLES")
    console.log("📊 Tabelas criadas:", tables.map((t) => Object.values(t)[0]).join(", "))

    const [produtos] = await connection.execute("SELECT COUNT(*) as total FROM produtos")
    const [clientes] = await connection.execute("SELECT COUNT(*) as total FROM clientes")
    const [pedidos] = await connection.execute("SELECT COUNT(*) as total FROM pedidos")
    const [vendas] = await connection.execute("SELECT COUNT(*) as total FROM vendas")
    const [estoque] = await connection.execute("SELECT COUNT(*) as total FROM estoque")

    console.log("\n📈 Dados inseridos:")
    console.log(`   • Produtos: ${produtos[0].total}`)
    console.log(`   • Clientes: ${clientes[0].total}`)
    console.log(`   • Pedidos: ${pedidos[0].total}`)
    console.log(`   • Vendas: ${vendas[0].total}`)
    console.log(`   • Registros de estoque: ${estoque[0].total}`)

    console.log("\n🎉 Banco de dados configurado com sucesso!")
    console.log("🚀 Agora você pode iniciar o servidor com: npm start")
  } catch (error) {
    console.error("❌ Erro ao configurar banco de dados:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase()
}

module.exports = setupDatabase
