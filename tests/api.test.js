const request = require("supertest")
const app = require("../server")

describe("DNCommerce API Tests", () => {
  // Health Check
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/api/health").expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe("OK")
    })
  })

  // Produtos Tests
  describe("Produtos API", () => {
    it("should get all produtos", async () => {
      const res = await request(app).get("/api/produtos").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it("should create a new produto", async () => {
      const novoProduto = {
        nome: "Produto Teste",
        descricao: "Descrição do produto teste",
        preco: 29.9,
        categoria: "maquiagem",
        marca: "Marca Teste",
      }

      const res = await request(app).post("/api/produtos").send(novoProduto).expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.nome).toBe(novoProduto.nome)
    })
  })

  // Clientes Tests
  describe("Clientes API", () => {
    it("should get all clientes", async () => {
      const res = await request(app).get("/api/clientes").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it("should create a new cliente", async () => {
      const novoCliente = {
        nome: "Cliente Teste",
        email: "teste@email.com",
        telefone: "(11) 99999-9999",
        endereco: "Endereço Teste",
      }

      const res = await request(app).post("/api/clientes").send(novoCliente).expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.nome).toBe(novoCliente.nome)
    })
  })

  // Pedidos Tests
  describe("Pedidos API", () => {
    it("should get all pedidos", async () => {
      const res = await request(app).get("/api/pedidos").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // Vendas Tests
  describe("Vendas API", () => {
    it("should get all vendas", async () => {
      const res = await request(app).get("/api/vendas").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // Estoque Tests
  describe("Estoque API", () => {
    it("should get all estoque", async () => {
      const res = await request(app).get("/api/estoque").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it("should get estoque alerts", async () => {
      const res = await request(app).get("/api/estoque/alertas/baixo").expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
