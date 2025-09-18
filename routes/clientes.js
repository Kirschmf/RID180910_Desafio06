const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const { validate, validateQuery } = require("../middleware/validation")
const responseHelper = require("../utils/responseHelper")
const queryHelper = require("../utils/queryHelper")

// GET /api/clientes - Listar clientes com filtros e paginação
router.get("/", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, ativo, sortBy, sortOrder } = req.query

    // Construir filtros
    const filters = {}
    if (search) filters.search = search
    if (ativo !== undefined) filters.ativo = ativo

    const { whereClause, values } = queryHelper.buildWhereClause(filters)
    const orderClause = queryHelper.buildOrderClause(sortBy || "nome", sortOrder)
    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM clientes ${whereClause}`
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal com estatísticas
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(v.valor_final), 0) as total_compras,
        MAX(p.created_at) as ultima_compra
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      ${whereClause}
      GROUP BY c.id
      ${orderClause}
      ${limitClause}
    `

    const [clientes] = await pool.execute(query, values)

    res.json(responseHelper.paginated(clientes, page, limit, total, "Clientes recuperados com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/clientes/:id - Buscar cliente por ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(v.valor_final), 0) as total_compras,
        MAX(p.created_at) as ultima_compra
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      WHERE c.id = ?
      GROUP BY c.id
    `

    const [clientes] = await pool.execute(query, [id])

    if (clientes.length === 0) {
      return res.status(404).json(responseHelper.error("Cliente não encontrado", 404))
    }

    res.json(responseHelper.success(clientes[0], "Cliente encontrado"))
  } catch (error) {
    next(error)
  }
})

// GET /api/clientes/:id/pedidos - Buscar pedidos do cliente
router.get("/:id/pedidos", validateQuery, async (req, res, next) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10, status } = req.query

    // Verificar se cliente existe
    const clienteQuery = "SELECT id FROM clientes WHERE id = ?"
    const [clienteResult] = await pool.execute(clienteQuery, [id])

    if (clienteResult.length === 0) {
      return res.status(404).json(responseHelper.error("Cliente não encontrado", 404))
    }

    // Construir filtros
    let whereClause = "WHERE p.cliente_id = ?"
    const values = [id]

    if (status) {
      whereClause += " AND p.status = ?"
      values.push(status)
    }

    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM pedidos p ${whereClause}`
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal
    const query = `
      SELECT 
        p.*,
        v.valor_final,
        v.forma_pagamento,
        v.data_venda,
        COUNT(pi.id) as total_itens
      FROM pedidos p
      LEFT JOIN vendas v ON p.id = v.pedido_id
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      ${limitClause}
    `

    const [pedidos] = await pool.execute(query, values)

    res.json(responseHelper.paginated(pedidos, page, limit, total, "Pedidos do cliente recuperados com sucesso"))
  } catch (error) {
    next(error)
  }
})

// POST /api/clientes - Criar novo cliente
router.post("/", validate("cliente"), async (req, res, next) => {
  try {
    const { nome, email, telefone, endereco, ativo = true } = req.body

    // Verificar se email já existe
    const emailQuery = "SELECT id FROM clientes WHERE email = ?"
    const [existing] = await pool.execute(emailQuery, [email])

    if (existing.length > 0) {
      return res.status(409).json(responseHelper.error("Email já cadastrado", 409))
    }

    // Inserir cliente
    const insertQuery = `
      INSERT INTO clientes (nome, email, telefone, endereco, ativo)
      VALUES (?, ?, ?, ?, ?)
    `

    const [result] = await pool.execute(insertQuery, [nome, email, telefone, endereco, ativo])

    // Buscar cliente criado
    const selectQuery = `
      SELECT 
        c.*,
        0 as total_pedidos,
        0 as total_compras,
        NULL as ultima_compra
      FROM clientes c
      WHERE c.id = ?
    `

    const [clientes] = await pool.execute(selectQuery, [result.insertId])

    res.status(201).json(responseHelper.success(clientes[0], "Cliente criado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// PUT /api/clientes/:id - Atualizar cliente
router.put("/:id", validate("cliente"), async (req, res, next) => {
  try {
    const { id } = req.params
    const { nome, email, telefone, endereco, ativo } = req.body

    // Verificar se cliente existe
    const checkQuery = "SELECT id FROM clientes WHERE id = ?"
    const [existing] = await pool.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Cliente não encontrado", 404))
    }

    // Verificar se email já existe em outro cliente
    const emailQuery = "SELECT id FROM clientes WHERE email = ? AND id != ?"
    const [emailExists] = await pool.execute(emailQuery, [email, id])

    if (emailExists.length > 0) {
      return res.status(409).json(responseHelper.error("Email já cadastrado para outro cliente", 409))
    }

    // Atualizar cliente
    const updateQuery = `
      UPDATE clientes 
      SET nome = ?, email = ?, telefone = ?, endereco = ?, ativo = ?
      WHERE id = ?
    `

    await pool.execute(updateQuery, [nome, email, telefone, endereco, ativo, id])

    // Buscar cliente atualizado
    const selectQuery = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(v.valor_final), 0) as total_compras,
        MAX(p.created_at) as ultima_compra
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      LEFT JOIN vendas v ON p.id = v.pedido_id
      WHERE c.id = ?
      GROUP BY c.id
    `

    const [clientes] = await pool.execute(selectQuery, [id])

    res.json(responseHelper.success(clientes[0], "Cliente atualizado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// DELETE /api/clientes/:id - Excluir cliente
router.delete("/:id", async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    const { id } = req.params

    await connection.beginTransaction()

    // Verificar se cliente existe
    const checkQuery = "SELECT id, nome FROM clientes WHERE id = ?"
    const [existing] = await connection.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Cliente não encontrado", 404))
    }

    // Verificar se cliente tem pedidos
    const pedidosQuery = "SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = ?"
    const [pedidosResult] = await connection.execute(pedidosQuery, [id])

    if (pedidosResult[0].total > 0) {
      // Se tem pedidos, apenas desativar
      await connection.execute("UPDATE clientes SET ativo = FALSE WHERE id = ?", [id])
      await connection.commit()

      return res.json(
        responseHelper.success(
          { id: Number.parseInt(id), nome: existing[0].nome, ativo: false },
          "Cliente desativado (possui histórico de pedidos)",
        ),
      )
    }

    // Se não tem pedidos, pode excluir completamente
    await connection.execute("DELETE FROM clientes WHERE id = ?", [id])
    await connection.commit()

    res.json(
      responseHelper.success({ id: Number.parseInt(id), nome: existing[0].nome }, "Cliente excluído com sucesso"),
    )
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

module.exports = router
