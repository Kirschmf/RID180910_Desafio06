const { spawn } = require("child_process")

console.log("🧪 Executando testes do DNCommerce API...\n")

const jest = spawn("npx", ["jest", "--verbose", "--coverage"], {
  stdio: "inherit",
  shell: true,
})

jest.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Todos os testes passaram!")
  } else {
    console.log("\n❌ Alguns testes falharam.")
    process.exit(code)
  }
})

jest.on("error", (error) => {
  console.error("❌ Erro ao executar testes:", error.message)
  process.exit(1)
})
