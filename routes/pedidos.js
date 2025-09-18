const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const { validate, validateQuery } = require("../middleware/validation")
const responseHelper = require("../utils/responseHelper")
const queryHelper = require("../utils/queryHelper")

// GET /api/pedidos - Listar pedidos com filtros e paginação
router.get("/", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, cliente_id, data_inicio, data_fim, sortBy, sortOrder } = req.query

    // Construir filtros
    const filters = {}
    if (status) filters.status = status
    if (cliente_id) filters.cliente_id = cliente_id
    if (data_inicio) filters.data_inicio = data_inicio
    if (data_fim) filters.data_fim = data_fim

    const { whereClause, values } = queryHelper.buildWhereClause(filters)
    const orderClause = queryHelper.buildOrderClause(sortBy || "created_at", sortOrder || "DESC")
    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      ${whereClause}
    `
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal
    const query = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.email as cliente_email,
        v.valor_final,
        v.forma_pagamento,
        v.data_venda,
        COUNT(pi.id) as total_itens
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      ${whereClause}
      GROUP BY p.id
      ${orderClause}
      ${limitClause}
    `

    const [pedidos] = await pool.execute(query, values)

    res.json(responseHelper.paginated(pedidos, page, limit, total, "Pedidos recuperados com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/pedidos/:id - Buscar pedido por ID com itens
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    // Buscar pedido
    const pedidoQuery = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        v.valor_final,
        v.desconto,
        v.forma_pagamento,
        v.data_venda
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      WHERE p.id = ?
    `

    const [pedidos] = await pool.execute(pedidoQuery, [id])

    if (pedidos.length === 0) {
      return res.status(404).json(responseHelper.error("Pedido não encontrado", 404))
    }

    // Buscar itens do pedido
    const itensQuery = `
      SELECT 
        pi.*,
        pr.nome as produto_nome,
        pr.categoria as produto_categoria,
        pr.marca as produto_marca
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = ?
      ORDER BY pi.id
    `

    const [itens] = await pool.execute(itensQuery, [id])

    const pedido = {
      ...pedidos[0],
      itens,
    }

    res.json(responseHelper.success(pedido, "Pedido encontrado"))
  } catch (error) {
    next(error)
  }
})

// POST /api/pedidos - Criar novo pedido
router.post("/", validate("pedido"), async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { cliente_id, itens, observacoes } = req.body

    // Verificar se cliente existe
    const clienteQuery = "SELECT id FROM clientes WHERE id = ? AND ativo = TRUE"
    const [clienteResult] = await connection.execute(clienteQuery, [cliente_id])

    if (clienteResult.length === 0) {
      return res.status(400).json(responseHelper.error("Cliente não encontrado ou inativo", 400))
    }

    // Verificar se todos os produtos existem e estão ativos
    const produtoIds = itens.map((item) => item.produto_id)
    const produtosQuery = `
      SELECT id, nome, preco, ativo 
      FROM produtos 
      WHERE id IN (${produtoIds.map(() => "?").join(",")})
    `
    const [produtos] = await connection.execute(produtosQuery, produtoIds)

    if (produtos.length !== produtoIds.length) {
      return res.status(400).json(responseHelper.error("Um ou mais produtos não foram encontrados", 400))
    }

    const produtosInativos = produtos.filter((p) => !p.ativo)
    if (produtosInativos.length > 0) {
      return res.status(400).json(responseHelper.error("Um ou mais produtos estão inativos", 400))
    }

    // Criar pedido
    const insertPedidoQuery = `
      INSERT INTO pedidos (cliente_id, observacoes)
      VALUES (?, ?)
    `

    const [pedidoResult] = await connection.execute(insertPedidoQuery, [cliente_id, observacoes])
    const pedidoId = pedidoResult.insertId

    // Inserir itens do pedido
    for (const item of itens) {
      const insertItemQuery = `
        INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
        VALUES (?, ?, ?, ?)
      `

      await connection.execute(insertItemQuery, [pedidoId, item.produto_id, item.quantidade, item.preco_unitario])
    }

    await connection.commit()

    // Buscar pedido criado com itens
    const selectQuery = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.email as cliente_email
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?
    `

    const [pedidoCriado] = await connection.execute(selectQuery, [pedidoId])

    // Buscar itens
    const itensQuery = `
      SELECT 
        pi.*,
        pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = ?
    `

    const [itensCriados] = await connection.execute(itensQuery, [pedidoId])

    const resultado = {
      ...pedidoCriado[0],
      itens: itensCriados,
    }

    res.status(201).json(responseHelper.success(resultado, "Pedido criado com sucesso"))
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// PUT /api/pedidos/:id - Atualizar pedido
router.put("/:id", async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    const { id } = req.params
    const { status, observacoes } = req.body

    await connection.beginTransaction()

    // Verificar se pedido existe
    const checkQuery = "SELECT id, status FROM pedidos WHERE id = ?"
    const [existing] = await connection.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Pedido não encontrado", 404))
    }

    // Verificar se pode alterar status
    const statusAtual = existing[0].status
    const statusValidos = ["pendente", "confirmado", "enviado", "entregue", "cancelado"]

    if (status && !statusValidos.includes(status)) {
      return res.status(400).json(responseHelper.error("Status inválido", 400))
    }

    // Não permitir alterar pedidos entregues ou cancelados
    if (["entregue", "cancelado"].includes(statusAtual) && status && status !== statusAtual) {
      return res.status(400).json(responseHelper.error("Não é possível alterar pedidos entregues ou cancelados", 400))
    }

    // Atualizar pedido
    const updateQuery = `
      UPDATE pedidos 
      SET status = COALESCE(?, status), observacoes = COALESCE(?, observacoes)
      WHERE id = ?
    `

    await connection.execute(updateQuery, [status, observacoes, id])

    await connection.commit()

    // Buscar pedido atualizado
    const selectQuery = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.email as cliente_email,
        v.valor_final,
        v.forma_pagamento,
        v.data_venda,
        COUNT(pi.id) as total_itens
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      WHERE p.id = ?
      GROUP BY p.id
    `

    const [pedidos] = await connection.execute(selectQuery, [id])

    res.json(responseHelper.success(pedidos[0], "Pedido atualizado com sucesso"))
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// DELETE /api/pedidos/:id - Cancelar pedido
router.delete("/:id", async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    const { id } = req.params

    await connection.beginTransaction()

    // Verificar se pedido existe
    const checkQuery = "SELECT id, status FROM pedidos WHERE id = ?"
    const [existing] = await connection.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Pedido não encontrado", 404))
    }

    const status = existing[0].status

    // Não permitir cancelar pedidos já entregues
    if (status === "entregue") {
      return res.status(400).json(responseHelper.error("Não é possível cancelar pedidos já entregues", 400))
    }

    // Se já está cancelado, retornar sucesso
    if (status === "cancelado") {
      return res.json(
        responseHelper.success({ id: Number.parseInt(id), status: "cancelado" }, "Pedido já estava cancelado"),
      )
    }

    // Cancelar pedido
    await connection.execute("UPDATE pedidos SET status = ? WHERE id = ?", ["cancelado", id])

    await connection.commit()

    res.json(responseHelper.success({ id: Number.parseInt(id), status: "cancelado" }, "Pedido cancelado com sucesso"))
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// GET /api/pedidos/status/lista - Listar status disponíveis
router.get("/status/lista", async (req, res, next) => {
  try {
    const statusList = [
      { value: "pendente", label: "Pendente", description: "Aguardando confirmação" },
      { value: "confirmado", label: "Confirmado", description: "Pedido confirmado" },
      { value: "enviado", label: "Enviado", description: "Pedido enviado" },
      { value: "entregue", label: "Entregue", description: "Pedido entregue" },
      { value: "cancelado", label: "Cancelado", description: "Pedido cancelado" },
    ]

    res.json(responseHelper.success(statusList, "Status disponíveis"))
  } catch (error) {
    next(error)
  }
})

module.exports = router
