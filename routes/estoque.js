const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const { validate, validateQuery } = require("../middleware/validation")
const responseHelper = require("../utils/responseHelper")
const queryHelper = require("../utils/queryHelper")

// GET /api/estoque - Listar estoque com filtros e paginação
router.get("/", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, categoria, marca, status_estoque, sortBy, sortOrder } = req.query

    // Construir filtros
    let whereClause = ""
    const values = []

    const conditions = []

    if (categoria) {
      conditions.push("p.categoria = ?")
      values.push(categoria)
    }

    if (marca) {
      conditions.push("p.marca = ?")
      values.push(marca)
    }

    if (status_estoque) {
      switch (status_estoque) {
        case "BAIXO":
          conditions.push("e.quantidade <= e.estoque_minimo AND e.quantidade > 0")
          break
        case "ZERADO":
          conditions.push("e.quantidade = 0")
          break
        case "OK":
          conditions.push("e.quantidade > e.estoque_minimo")
          break
      }
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`
    }

    const orderClause = queryHelper.buildOrderClause(sortBy || "quantidade", sortOrder || "ASC")
    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      ${whereClause}
    `
    const [countResult] = await pool.execute(countQuery, values)
    const total = countResult[0].total

    // Query principal
    const query = `
      SELECT 
        e.*,
        p.nome as produto_nome,
        p.preco as produto_preco,
        p.categoria as produto_categoria,
        p.marca as produto_marca,
        p.ativo as produto_ativo,
        CASE 
          WHEN e.quantidade <= e.estoque_minimo AND e.quantidade > 0 THEN 'BAIXO'
          WHEN e.quantidade = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `

    const [estoque] = await pool.execute(query, values)

    res.json(responseHelper.paginated(estoque, page, limit, total, "Estoque recuperado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/estoque/:produto_id - Buscar estoque de um produto
router.get("/:produto_id", async (req, res, next) => {
  try {
    const { produto_id } = req.params

    const query = `
      SELECT 
        e.*,
        p.nome as produto_nome,
        p.preco as produto_preco,
        p.categoria as produto_categoria,
        p.marca as produto_marca,
        p.ativo as produto_ativo,
        CASE 
          WHEN e.quantidade <= e.estoque_minimo AND e.quantidade > 0 THEN 'BAIXO'
          WHEN e.quantidade = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.produto_id = ?
    `

    const [estoque] = await pool.execute(query, [produto_id])

    if (estoque.length === 0) {
      return res.status(404).json(responseHelper.error("Estoque não encontrado para este produto", 404))
    }

    res.json(responseHelper.success(estoque[0], "Estoque encontrado"))
  } catch (error) {
    next(error)
  }
})

// POST /api/estoque - Criar registro de estoque
router.post("/", validate("estoque"), async (req, res, next) => {
  try {
    const { produto_id, quantidade, estoque_minimo = 5 } = req.body

    // Verificar se produto existe
    const produtoQuery = "SELECT id, nome FROM produtos WHERE id = ?"
    const [produtos] = await pool.execute(produtoQuery, [produto_id])

    if (produtos.length === 0) {
      return res.status(404).json(responseHelper.error("Produto não encontrado", 404))
    }

    // Verificar se já existe estoque para este produto
    const estoqueExistenteQuery = "SELECT id FROM estoque WHERE produto_id = ?"
    const [estoqueExistente] = await pool.execute(estoqueExistenteQuery, [produto_id])

    if (estoqueExistente.length > 0) {
      return res.status(409).json(responseHelper.error("Já existe registro de estoque para este produto", 409))
    }

    // Criar registro de estoque
    const insertQuery = `
      INSERT INTO estoque (produto_id, quantidade, estoque_minimo)
      VALUES (?, ?, ?)
    `

    const [result] = await pool.execute(insertQuery, [produto_id, quantidade, estoque_minimo])

    // Buscar registro criado
    const selectQuery = `
      SELECT 
        e.*,
        p.nome as produto_nome,
        p.categoria as produto_categoria,
        p.marca as produto_marca,
        CASE 
          WHEN e.quantidade <= e.estoque_minimo AND e.quantidade > 0 THEN 'BAIXO'
          WHEN e.quantidade = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.id = ?
    `

    const [estoqueCriado] = await pool.execute(selectQuery, [result.insertId])

    res.status(201).json(responseHelper.success(estoqueCriado[0], "Registro de estoque criado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// PUT /api/estoque/:produto_id - Atualizar estoque
router.put("/:produto_id", async (req, res, next) => {
  try {
    const { produto_id } = req.params
    const { quantidade, estoque_minimo, operacao } = req.body

    // Verificar se estoque existe
    const checkQuery = `
      SELECT e.*, p.nome as produto_nome
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.produto_id = ?
    `
    const [existing] = await pool.execute(checkQuery, [produto_id])

    if (existing.length === 0) {
      return res.status(404).json(responseHelper.error("Estoque não encontrado para este produto", 404))
    }

    let novaQuantidade = quantidade

    // Se operação foi especificada, calcular nova quantidade
    if (operacao && quantidade !== undefined) {
      const quantidadeAtual = existing[0].quantidade

      switch (operacao) {
        case "adicionar":
          novaQuantidade = quantidadeAtual + quantidade
          break
        case "remover":
          novaQuantidade = Math.max(0, quantidadeAtual - quantidade)
          break
        case "definir":
          novaQuantidade = quantidade
          break
        default:
          return res
            .status(400)
            .json(responseHelper.error("Operação inválida. Use: adicionar, remover ou definir", 400))
      }
    }

    // Validar quantidade
    if (novaQuantidade !== undefined && (novaQuantidade < 0 || isNaN(novaQuantidade))) {
      return res.status(400).json(responseHelper.error("Quantidade deve ser um número positivo", 400))
    }

    // Validar estoque mínimo
    if (estoque_minimo !== undefined && (estoque_minimo < 0 || isNaN(estoque_minimo))) {
      return res.status(400).json(responseHelper.error("Estoque mínimo deve ser um número positivo", 400))
    }

    // Atualizar estoque
    const updateQuery = `
      UPDATE estoque 
      SET quantidade = COALESCE(?, quantidade), 
          estoque_minimo = COALESCE(?, estoque_minimo)
      WHERE produto_id = ?
    `

    await pool.execute(updateQuery, [novaQuantidade, estoque_minimo, produto_id])

    // Buscar estoque atualizado
    const selectQuery = `
      SELECT 
        e.*,
        p.nome as produto_nome,
        p.categoria as produto_categoria,
        p.marca as produto_marca,
        CASE 
          WHEN e.quantidade <= e.estoque_minimo AND e.quantidade > 0 THEN 'BAIXO'
          WHEN e.quantidade = 0 THEN 'ZERADO'
          ELSE 'OK'
        END as status_estoque
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.produto_id = ?
    `

    const [estoqueAtualizado] = await pool.execute(selectQuery, [produto_id])

    res.json(responseHelper.success(estoqueAtualizado[0], "Estoque atualizado com sucesso"))
  } catch (error) {
    next(error)
  }
})

// GET /api/estoque/alertas/baixo - Produtos com estoque baixo
router.get("/alertas/baixo", validateQuery, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query

    const { limitClause } = queryHelper.buildLimitClause(page, limit)

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.quantidade <= e.estoque_minimo AND p.ativo = TRUE
    `
    const [countResult] = await pool.execute(countQuery)
    const total = countResult[0].total

    // Query principal
    const query = `
      SELECT 
        e.*,
        p.nome as produto_nome,
        p.preco as produto_preco,
        p.categoria as produto_categoria,
        p.marca as produto_marca,
        CASE 
          WHEN e.quantidade = 0 THEN 'CRÍTICO'
          ELSE 'BAIXO'
        END as nivel_alerta
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.quantidade <= e.estoque_minimo AND p.ativo = TRUE
      ORDER BY e.quantidade ASC, p.nome ASC
      ${limitClause}
    `

    const [alertas] = await pool.execute(query)

    res.json(responseHelper.paginated(alertas, page, limit, total, "Alertas de estoque baixo"))
  } catch (error) {
    next(error)
  }
})

// GET /api/estoque/relatorio/resumo - Relatório resumo do estoque
router.get("/relatorio/resumo", async (req, res, next) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_produtos,
        SUM(e.quantidade) as quantidade_total,
        COUNT(CASE WHEN e.quantidade = 0 THEN 1 END) as produtos_zerados,
        COUNT(CASE WHEN e.quantidade <= e.estoque_minimo AND e.quantidade > 0 THEN 1 END) as produtos_baixo_estoque,
        COUNT(CASE WHEN e.quantidade > e.estoque_minimo THEN 1 END) as produtos_ok,
        AVG(e.quantidade) as media_estoque,
        SUM(e.quantidade * p.preco) as valor_total_estoque,
        p.categoria,
        COUNT(*) as produtos_por_categoria,
        SUM(e.quantidade) as quantidade_por_categoria
      FROM estoque e
      JOIN produtos p ON e.produto_id = p.id
      WHERE p.ativo = TRUE
      GROUP BY p.categoria
      WITH ROLLUP
    `

    const [resumo] = await pool.execute(query)

    res.json(responseHelper.success(resumo, "Relatório de estoque gerado"))
  } catch (error) {
    next(error)
  }
})

module.exports = router
