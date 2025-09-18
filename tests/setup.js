const { testConnection } = require("../config/database")
const { beforeAll, afterAll } = require("@jest/globals")

beforeAll(async () => {
  // Testar conexão com banco antes dos testes
  const connected = await testConnection()
  if (!connected) {
    console.error("❌ Não foi possível conectar ao banco de dados para os testes")
    process.exit(1)
  }
})

afterAll(async () => {
  // Cleanup após os testes
  console.log("🧹 Limpeza após testes concluída")
})
