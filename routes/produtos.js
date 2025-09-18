const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const { validate, validateQuery } = require("../middleware/validation")
const responseHelper = require("../utils/responseHelper")
const queryHelper = require("../utils/queryHelper")

// GET /api/produtos - Listar produtos com filtros e paginação
router.get("/", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, categoria, marca, ativo, sortBy, sortOrder } = req.query

    // Construir filtros
    const filters = {}
    if (search) filters.search = search
    if (categoria) filters.categoria = categoria
    if (marca) filters.marca = marca
    if (ativo !== undefined) filters.ativo = ativo

    const { whereClause, values } = queryHelper.buildWhereClause(filters)
    const orderClause = queryHelper.buildOrderClause(sortBy, sortOrder)
    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM produtos ${whereClause}`
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal com estoque
    const query = `
      SELECT 
        p.*,
        COALESCE(e.quantidade, 0) as quantidade_estoque,
        COALESCE(e.estoque_minimo, 5) as estoque_minimo,
        CASE 
          WHEN COALESCE(e.quantidade, 0) <= COALESCE(e.estoque_minimo, 5) THEN 'BAIXO'
          WHEN COALESCE(e.quantidade, 0) = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM produtos p
      LEFT JOIN estoque e ON p.id = e.produto_id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `

    const [produtos] = await pool.execute(query, values)

    res.json(responseHelper.paginated(produtos, page, limit, total, "Produtos recuperados com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/produtos/:id - Buscar produto por ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        p.*,
        COALESCE(e.quantidade, 0) as quantidade_estoque,
        COALESCE(e.estoque_minimo, 5) as estoque_minimo,
        CASE 
          WHEN COALESCE(e.quantidade, 0) <= COALESCE(e.estoque_minimo, 5) THEN 'BAIXO'
          WHEN COALESCE(e.quantidade, 0) = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM produtos p
      LEFT JOIN estoque e ON p.id = e.produto_id
      WHERE p.id = ?
    `

    const [produtos] = await pool.execute(query, [id])

    if (produtos.length === 0) {
      return res.status(404).json(responseHelper.error("Produto não encontrado", 404))
    }

    res.json(responseHelper.success(produtos[0], "Produto encontrado"))
  } catch (error) {
    next(error)
  }
})

// POST /api/produtos - Criar novo produto
router.post("/", validate("produto"), async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { nome, descricao, preco, categoria, marca, ativo = true } = req.body

    // Inserir produto
    const insertQuery = `
      INSERT INTO produtos (nome, descricao, preco, categoria, marca, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const [result] = await connection.execute(insertQuery, [nome, descricao, preco, categoria, marca, ativo])
    const produtoId = result.insertId

    // Criar registro de estoque inicial
    const estoqueQuery = `
      INSERT INTO estoque (produto_id, quantidade, estoque_minimo)
      VALUES (?, 0, 5)
    `
    await connection.execute(estoqueQuery, [produtoId])

    // Buscar produto criado com estoque
    const selectQuery = `
      SELECT 
        p.*,
        e.quantidade as quantidade_estoque,
        e.estoque_minimo,
        'OK' as status_estoque
      FROM produtos p
      JOIN estoque e ON p.id = e.produto_id
      WHERE p.id = ?
    `

    const [produtos] = await connection.execute(selectQuery, [produtoId])

    await connection.commit()
    res.status(201).json(responseHelper.success(produtos[0], "Produto criado com sucesso"))
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// PUT /api/produtos/:id - Atualizar produto
router.put("/:id", validate("produto"), async (req, res, next) => {
  try {
    const { id } = req.params
    const { nome, descricao, preco, categoria, marca, ativo } = req.body

    // Verificar se produto existe
    const checkQuery = "SELECT id FROM produtos WHERE id = ?"
    const [existing] = await pool.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Produto não encontrado", 404))
    }

    // Atualizar produto
    const updateQuery = `
      UPDATE produtos 
      SET nome = ?, descricao = ?, preco = ?, categoria = ?, marca = ?, ativo = ?
      WHERE id = ?
    `

    await pool.execute(updateQuery, [nome, descricao, preco, categoria, marca, ativo, id])

    // Buscar produto atualizado
    const selectQuery = `
      SELECT 
        p.*,
        COALESCE(e.quantidade, 0) as quantidade_estoque,
        COALESCE(e.estoque_minimo, 5) as estoque_minimo,
        CASE 
          WHEN COALESCE(e.quantidade, 0) <= COALESCE(e.estoque_minimo, 5) THEN 'BAIXO'
          WHEN COALESCE(e.quantidade, 0) = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM produtos p
      LEFT JOIN estoque e ON p.id = e.produto_id
      WHERE p.id = ?
    `

    const [produtos] = await pool.execute(selectQuery, [id])

    res.json(responseHelper.success(produtos[0], "Produto atualizado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// DELETE /api/produtos/:id - Excluir produto
router.delete("/:id", async (req, res, next) => {
  const connection = await pool.getConnection()

  try {
    const { id } = req.params

    await connection.beginTransaction()

    // Verificar se produto existe
    const checkQuery = "SELECT id, nome FROM produtos WHERE id = ?"
    const [existing] = await connection.execute(checkQuery, [id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Produto não encontrado", 404))
    }

    // Verificar se produto tem pedidos associados
    const pedidosQuery = "SELECT COUNT(*) as total FROM pedido_itens WHERE produto_id = ?"
    const [pedidosResult] = await connection.execute(pedidosQuery, [id])

    if (pedidosResult[0].total > 0) {
      // Se tem pedidos, apenas desativar
      await connection.execute("UPDATE produtos SET ativo = FALSE WHERE id = ?", [id])
      await connection.commit()

      return res.json(
        responseHelper.success(
          { id: Number.parseInt(id), nome: existing[0].nome, ativo: false },
          "Produto desativado (possui histórico de pedidos)",
        ),
      )
    }

    // Se não tem pedidos, pode excluir completamente
    await connection.execute("DELETE FROM produtos WHERE id = ?", [id])
    await connection.commit()

    res.json(
      responseHelper.success({ id: Number.parseInt(id), nome: existing[0].nome }, "Produto excluído com sucesso"),
    )
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

// GET /api/produtos/categorias/lista - Listar categorias disponíveis
router.get("/categorias/lista", async (req, res, next) => {
  try {
    const query = `
      SELECT 
        categoria,
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN ativo = TRUE THEN 1 END) as produtos_ativos
      FROM produtos 
      GROUP BY categoria
      ORDER BY categoria
    `

    const [categorias] = await pool.execute(query)

    res.json(responseHelper.success(categorias, "Categorias recuperadas com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/produtos/marcas/lista - Listar marcas disponíveis
router.get("/marcas/lista", async (req, res, next) => {
  try {
    const query = `
      SELECT 
        marca,
        COUNT(*) as total_produtos,
        COUNT(CASE WHEN ativo = TRUE THEN 1 END) as produtos_ativos
      FROM produtos 
      GROUP BY marca
      ORDER BY marca
    `

    const [marcas] = await pool.execute(query)

    res.json(responseHelper.success(marcas, "Marcas recuperadas com sucesso"))
  } catch (error) {
    next(error)
  }
})

module.exports = router
