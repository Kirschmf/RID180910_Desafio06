/**
 * Helper para padronizar respostas da API
 */
const responseHelper = {
  success: (data = null, message = "Sucesso", meta = null) => {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }

    if (meta) {
      response.meta = meta
    }

    return response
  },

  error: (message = "Erro interno do servidor", statusCode = 500, details = null) => {
    const response = {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    }

    if (details) {
      response.details = details
    }

    return response
  },

  paginated: (data, page, limit, total, message = "Dados recuperados com sucesso") => {
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      message,
      data,
      meta: {
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: Number.parseInt(total),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    }
  },
}

module.exports = responseHelper
