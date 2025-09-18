const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const { validate, validateQuery } = require("../middleware/validation")
const responseHelper = require("../utils/responseHelper")
const queryHelper = require("../utils/queryHelper")

// GET /api/vendas - Listar vendas com filtros e paginação
router.get("/", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, forma_pagamento, data_inicio, data_fim, cliente_id, sortBy, sortOrder } = req.query

    // Construir filtros
    const filters = {}
    if (forma_pagamento) filters.forma_pagamento = forma_pagamento
    if (data_inicio) filters.data_inicio = data_inicio
    if (data_fim) filters.data_fim = data_fim
    if (cliente_id) filters.cliente_id = cliente_id

    let whereClause = ""
    const values = []

    if (Object.keys(filters).length > 0) {
      const conditions = []

      if (filters.forma_pagamento) {
        conditions.push("v.forma_pagamento = ?")
        values.push(filters.forma_pagamento)
      }

      if (filters.data_inicio) {
        conditions.push("DATE(v.data_venda) >= ?")
        values.push(filters.data_inicio)
      }

      if (filters.data_fim) {
        conditions.push("DATE(v.data_venda) <= ?")
        values.push(filters.data_fim)
      }

      if (filters.cliente_id) {
        conditions.push("p.cliente_id = ?")
        values.push(filters.cliente_id)
      }

      whereClause = `WHERE ${conditions.join(" AND ")}`
    }

    const orderClause = queryHelper.buildOrderClause(sortBy || "data_venda", sortOrder || "DESC")
    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      ${whereClause}
    `
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal
    const query = `
      SELECT 
        v.*,
        p.cliente_id,
        c.nome as cliente_nome,
        c.email as cliente_email,
        p.total as pedido_total,
        p.status as pedido_status,
        COUNT(pi.id) as total_itens
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      ${whereClause}
      GROUP BY v.id
      ${orderClause}
      ${limitClause}
    `

    const [vendas] = await pool.execute(query, values)

    res.json(responseHelper.paginated(vendas, page, limit, total, "Vendas recuperadas com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/vendas/:id - Buscar venda por ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        v.*,
        p.cliente_id,
        p.observacoes as pedido_observacoes,
        c.nome as cliente_nome,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      WHERE v.id = ?
    `

    const [vendas] = await pool.execute(query, [id])

    if (vendas.length === 0) {
      return res.status(404).json(responseHelper.error("Venda não encontrada", 404))
    }

    // Buscar itens da venda
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

    const [itens] = await pool.execute(itensQuery, [vendas[0].pedido_id])

    const venda = {
      ...vendas[0],
      itens,
    }

    res.json(responseHelper.success(venda, "Venda encontrada"))
  } catch (error) {
    next(error)
  }
})

// POST /api/vendas - Criar nova venda
router.post("/", validate("venda"), async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { pedido_id, forma_pagamento, desconto = 0 } = req.body

    // Verificar se pedido existe e está confirmado
    const pedidoQuery = `
      SELECT p.*, c.nome as cliente_nome
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?
    `
    const [pedidos] = await connection.execute(pedidoQuery, [pedido_id])

    if (pedidos.length === 0) {
      return res.status(404).json(responseHelper.error("Pedido não encontrado", 404))
    }

    const pedido = pedidos[0]

    // Verificar se pedido já tem venda
    const vendaExistenteQuery = "SELECT id FROM vendas WHERE pedido_id = ?"
    const [vendaExistente] = await connection.execute(vendaExistenteQuery, [pedido_id])

    if (vendaExistente.length > 0) {
      return res.status(409).json(responseHelper.error("Pedido já possui venda registrada", 409))
    }

    // Verificar se há estoque suficiente
    const itensQuery = `
      SELECT pi.produto_id, pi.quantidade, pr.nome as produto_nome, e.quantidade as estoque_atual
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      LEFT JOIN estoque e ON pr.id = e.produto_id
      WHERE pi.pedido_id = ?
    `
    const [itens] = await connection.execute(itensQuery, [pedido_id])

    const estoqueInsuficiente = itens.filter((item) => (item.estoque_atual || 0) < item.quantidade)

    if (estoqueInsuficiente.length > 0) {
      const produtos = estoqueInsuficiente
        .map((item) => `${item.produto_nome} (disponível: ${item.estoque_atual || 0}, necessário: ${item.quantidade})`)
        .join(", ")

      return res.status(400).json(responseHelper.error(`Estoque insuficiente para: ${produtos}`, 400))
    }

    // Criar venda
    const insertVendaQuery = `
      INSERT INTO vendas (pedido_id, valor_total, desconto, forma_pagamento)
      VALUES (?, ?, ?, ?)
    `

    const [vendaResult] = await connection.execute(insertVendaQuery, [
      pedido_id,
      pedido.total,
      desconto,
      forma_pagamento,
    ])

    // Atualizar status do pedido para confirmado
    await connection.execute("UPDATE pedidos SET status = ? WHERE id = ?", ["confirmado", pedido_id])

    await connection.commit()

    // Buscar venda criada
    const selectQuery = `
      SELECT 
        v.*,
        p.cliente_id,
        c.nome as cliente_nome,
        c.email as cliente_email,
        p.total as pedido_total
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      WHERE v.id = ?
    `

    const [vendaCriada] = await connection.execute(selectQuery, [vendaResult.insertId])

    res.status(201).json(responseHelper.success(vendaCriada[0], "Venda criada com sucesso"))
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// PUT /api/vendas/:id - Atualizar venda
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { forma_pagamento, desconto } = req.body

    // Verificar se venda existe
    const checkQuery = "SELECT id, pedido_id FROM vendas WHERE id = ?"
    const [existing] = await pool.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Venda não encontrada", 404))
    }

    // Validar forma de pagamento se fornecida
    if (forma_pagamento) {
      const formasValidas = ["dinheiro", "cartao_credito", "cartao_debito", "pix", "transferencia"]
      if (!formasValidas.includes(forma_pagamento)) {
        return res.status(400).json(responseHelper.error("Forma de pagamento inválida", 400))
      }
    }

    // Validar desconto se fornecido
    if (desconto !== undefined && (desconto < 0 || isNaN(desconto))) {
      return res.status(400).json(responseHelper.error("Desconto deve ser um valor positivo", 400))
    }

    // Atualizar venda
    const updateQuery = `
      UPDATE vendas 
      SET forma_pagamento = COALESCE(?, forma_pagamento), 
          desconto = COALESCE(?, desconto)
      WHERE id = ?
    `

    await pool.execute(updateQuery, [forma_pagamento, desconto, id])

    // Buscar venda atualizada
    const selectQuery = `
      SELECT 
        v.*,
        p.cliente_id,
        c.nome as cliente_nome,
        c.email as cliente_email,
        p.total as pedido_total
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      WHERE v.id = ?
    `

    const [vendas] = await pool.execute(selectQuery, [id])

    res.json(responseHelper.success(vendas[0], "Venda atualizada com sucesso"))
  } catch (error) {
    next(error)
  }
})

// DELETE /api/vendas/:id - Cancelar venda
router.delete("/:id", async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    const { id } = req.params

    await connection.beginTransaction()

    // Verificar se venda existe
    const checkQuery = `
      SELECT v.id, v.pedido_id, p.status
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      WHERE v.id = ?
    `
    const [existing] = await connection.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Venda não encontrada", 404))
    }

    const { pedido_id, status } = existing[0]

    // Não permitir cancelar vendas de pedidos já entregues
    if (status === "entregue") {
      return res.status(400).json(responseHelper.error("Não é possível cancelar vendas de pedidos já entregues", 400))
    }

    // Restaurar estoque (reverter a diminuição que foi feita na venda)
    const itensQuery = `
      SELECT pi.produto_id, pi.quantidade
      FROM pedido_itens pi
      WHERE pi.pedido_id = ?
    `
    const [itens] = await connection.execute(itensQuery, [pedido_id])

    for (const item of itens) {
      await connection.execute("UPDATE estoque SET quantidade = quantidade + ? WHERE produto_id = ?", [
        item.quantidade,
        item.produto_id,
      ])
    }

    // Excluir venda
    await connection.execute("DELETE FROM vendas WHERE id = ?", [id])

    // Voltar status do pedido para pendente
    await connection.execute("UPDATE pedidos SET status = ? WHERE id = ?", ["pendente", pedido_id])

    await connection.commit()

    res.json(
      responseHelper.success(
        { id: Number.parseInt(id), pedido_id: Number.parseInt(pedido_id) },
        "Venda cancelada e estoque restaurado",
      ),
    )
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// GET /api/vendas/relatorio/resumo - Relatório resumo de vendas
router.get("/relatorio/resumo", validateQuery, async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query

    let whereClause = ""
    const values = []

    if (data_inicio || data_fim) {
      const conditions = []
      if (data_inicio) {
        conditions.push("DATE(v.data_venda) >= ?")
        values.push(data_inicio)
      }
      if (data_fim) {
        conditions.push("DATE(v.data_venda) <= ?")
        values.push(data_fim)
      }
      whereClause = `WHERE ${conditions.join(" AND ")}`
    }

    const query = `
      SELECT 
        COUNT(*) as total_vendas,
        SUM(v.valor_final) as faturamento_total,
        AVG(v.valor_final) as ticket_medio,
        SUM(v.desconto) as total_descontos,
        COUNT(DISTINCT p.cliente_id) as clientes_unicos,
        v.forma_pagamento,
        COUNT(*) as vendas_por_forma,
        SUM(v.valor_final) as faturamento_por_forma
      FROM vendas v
      JOIN pedidos p ON v.pedido_id = p.id
      ${whereClause}
      GROUP BY v.forma_pagamento
      WITH ROLLUP
    `

    const [resultado] = await pool.execute(query, values)

    res.json(responseHelper.success(resultado, "Relatório de vendas gerado"))
  } catch (error) {
    next(error)
  }
})

// GET /api/vendas/formas-pagamento/lista - Listar formas de pagamento
router.get("/formas-pagamento/lista", async (req, res, next) => {
  try {
    const formasPagamento = [
      { value: "dinheiro", label: "Dinheiro" },
      { value: "cartao_credito", label: "Cartão de Crédito" },
      { value: "cartao_debito", label: "Cartão de Débito" },
      { value: "pix", label: "PIX" },
      { value: "transferencia", label: "Transferência Bancária" },
    ]

    res.json(responseHelper.success(formasPagamento, "Formas de pagamento disponíveis"))
  } catch (error) {
    next(error)
  }
})

module.exports = router
