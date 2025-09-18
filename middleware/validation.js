const Joi = require("joi")
const responseHelper = require("../utils/responseHelper")

// Schemas de validação
const schemas = {
  produto: Joi.object({
    nome: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome deve ter pelo menos 2 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    descricao: Joi.string().max(500).allow("").messages({
      "string.max": "Descrição deve ter no máximo 500 caracteres",
    }),
    preco: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Preço deve ser positivo",
      "any.required": "Preço é obrigatório",
    }),
    categoria: Joi.string().valid("maquiagem", "skincare", "cabelo", "perfume", "corpo").required().messages({
      "any.only": "Categoria deve ser: maquiagem, skincare, cabelo, perfume ou corpo",
      "any.required": "Categoria é obrigatória",
    }),
    marca: Joi.string().min(2).max(50).required().messages({
      "string.min": "Marca deve ter pelo menos 2 caracteres",
      "string.max": "Marca deve ter no máximo 50 caracteres",
      "any.required": "Marca é obrigatória",
    }),
    ativo: Joi.boolean().default(true),
  }),

  cliente: Joi.object({
    nome: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome deve ter pelo menos 2 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter formato válido",
      "any.required": "Email é obrigatório",
    }),
    telefone: Joi.string()
      .pattern(/^$$\d{2}$$\s\d{4,5}-\d{4}$/)
      .allow("")
      .messages({
        "string.pattern.base": "Telefone deve ter formato (XX) XXXXX-XXXX",
      }),
    endereco: Joi.string().max(200).allow("").messages({
      "string.max": "Endereço deve ter no máximo 200 caracteres",
    }),
    ativo: Joi.boolean().default(true),
  }),

  pedido: Joi.object({
    cliente_id: Joi.number().integer().positive().required().messages({
      "number.positive": "ID do cliente deve ser positivo",
      "any.required": "ID do cliente é obrigatório",
    }),
    itens: Joi.array()
      .items(
        Joi.object({
          produto_id: Joi.number().integer().positive().required(),
          quantidade: Joi.number().integer().positive().required(),
          preco_unitario: Joi.number().positive().precision(2).required(),
        }),
      )
      .min(1)
      .required()
      .messages({
        "array.min": "Pedido deve ter pelo menos 1 item",
        "any.required": "Itens são obrigatórios",
      }),
    observacoes: Joi.string().max(500).allow(""),
  }),

  venda: Joi.object({
    pedido_id: Joi.number().integer().positive().required().messages({
      "number.positive": "ID do pedido deve ser positivo",
      "any.required": "ID do pedido é obrigatório",
    }),
    forma_pagamento: Joi.string()
      .valid("dinheiro", "cartao_credito", "cartao_debito", "pix", "transferencia")
      .required()
      .messages({
        "any.only": "Forma de pagamento deve ser: dinheiro, cartao_credito, cartao_debito, pix ou transferencia",
        "any.required": "Forma de pagamento é obrigatória",
      }),
    desconto: Joi.number().min(0).precision(2).default(0).messages({
      "number.min": "Desconto não pode ser negativo",
    }),
  }),

  estoque: Joi.object({
    produto_id: Joi.number().integer().positive().required().messages({
      "number.positive": "ID do produto deve ser positivo",
      "any.required": "ID do produto é obrigatório",
    }),
    quantidade: Joi.number().integer().min(0).required().messages({
      "number.min": "Quantidade não pode ser negativa",
      "any.required": "Quantidade é obrigatória",
    }),
    estoque_minimo: Joi.number().integer().min(0).default(5).messages({
      "number.min": "Estoque mínimo não pode ser negativo",
    }),
  }),
}

// Middleware de validação
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schemas[schema].validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      return res.status(400).json(responseHelper.error("Dados inválidos", 400, errors))
    }

    req.body = value
    next()
  }
}

// Validação de parâmetros de query
const validateQuery = (req, res, next) => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).allow(""),
    categoria: Joi.string().valid("maquiagem", "skincare", "cabelo", "perfume", "corpo").allow(""),
    marca: Joi.string().max(50).allow(""),
    ativo: Joi.boolean(),
    data_inicio: Joi.date().iso(),
    data_fim: Joi.date().iso().min(Joi.ref("data_inicio")),
  }).unknown(true)

  const { error, value } = querySchema.validate(req.query)

  if (error) {
    return res.status(400).json(responseHelper.error("Parâmetros de consulta inválidos", 400))
  }

  req.query = value
  next()
}

module.exports = {
  validate,
  validateQuery,
  schemas,
}
