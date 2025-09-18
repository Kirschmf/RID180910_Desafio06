/**
 * Helper para construir queries SQL dinâmicas
 */
const queryHelper = {
  buildWhereClause: (filters) => {
    const conditions = []
    const values = []

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        switch (key) {
          case "search":
            conditions.push("(nome LIKE ? OR descricao LIKE ?)")
            values.push(`%${value}%`, `%${value}%`)
            break
          case "categoria":
          case "marca":
          case "ativo":
            conditions.push(`${key} = ?`)
            values.push(value)
            break
          case "data_inicio":
            conditions.push("DATE(created_at) >= ?")
            values.push(value)
            break
          case "data_fim":
            conditions.push("DATE(created_at) <= ?")
            values.push(value)
            break
          default:
            if (typeof value === "string" || typeof value === "number") {
              conditions.push(`${key} = ?`)
              values.push(value)
            }
        }
      }
    })

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      values,
    }
  },

  buildOrderClause: (sortBy = "created_at", sortOrder = "DESC") => {
    const allowedSortFields = ["id", "nome", "preco", "categoria", "marca", "created_at", "updated_at"]
    const allowedSortOrders = ["ASC", "DESC"]

    const field = allowedSortFields.includes(sortBy) ? sortBy : "created_at"
    const order = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "DESC"

    return `ORDER BY ${field} ${order}`
  },

  buildLimitClause: (page = 1, limit = 10) => {
    const offset = (page - 1) * limit
    return {
      limitClause: `LIMIT ${limit} OFFSET ${offset}`,
      offset,
      limit: Number.parseInt(limit),
    }
  },
}

module.exports = queryHelper
