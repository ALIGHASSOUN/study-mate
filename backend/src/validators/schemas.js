const Joi = require("joi");

// Auth
const loginSchema = Joi.object({
  username: Joi.string().trim().lowercase().min(3).max(30).required(),
  password: Joi.string().min(4).max(128).required(),
});

const verifyCodeSchema = Joi.object({
  sessionId: Joi.string().required(),
  code: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required(),
});

// Users
const createUserSchema = Joi.object({
  username: Joi.string().trim().lowercase().min(3).max(30).required(),
  password: Joi.string().min(4).max(128).required(),
});

const updateUserSchema = Joi.object({
  password: Joi.string().min(4).max(128).optional(),
  isActive: Joi.boolean().optional(),
});

// Products
const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  category: Joi.string().trim().min(1).max(50).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().optional(),
});

// Settings
const settingsSchema = Joi.object({
  singlePriceStandard: Joi.number().min(0).optional(),
  singlePricePremium: Joi.number().min(0).optional(),
  doublePriceStandard: Joi.number().min(0).optional(),
  doublePricePremium: Joi.number().min(0).optional(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  minutesUnit: Joi.number().integer().min(1).optional(),
  roundUpThreshold: Joi.number().integer().min(0).optional(),
  cafeName: Joi.string().trim().max(100).optional(),
  cafePhone: Joi.string().trim().max(30).allow("").optional(),
  currency: Joi.string().trim().max(10).optional(),
  totalChairs: Joi.number().integer().min(1).optional(),
});

// Reservations
const createReservationSchema = Joi.object({
  chairNumbers: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .max(2)
    .required(),
  type: Joi.string().valid("single", "double").required(),
  internetType: Joi.string().valid("standard", "premium").required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  cashierSessionId: Joi.string().required(),
});

const addItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

// Close reservation
const closeReservationSchema = Joi.object({
  applyDiscount: Joi.boolean().optional(),
  discountPercentOverride: Joi.number().min(0).max(100).optional(),
});

// Manual invoice
const manualInvoiceSchema = Joi.object({
  chairNumbers: Joi.array()
    .items(Joi.number().integer().min(1))
    .optional(),
  type: Joi.string().valid("single", "double", "manual").optional(),
  internetType: Joi.string().valid("standard", "premium").optional(),
  startedAt: Joi.date().iso().required(),
  endedAt: Joi.date().iso().greater(Joi.ref("startedAt")).required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().optional(),
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .optional(),
  discountPercent: Joi.number().min(0).max(100).optional(),
});

// Update invoice
const updateInvoiceSchema = Joi.object({
  discountPercent: Joi.number().min(0).max(100).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().optional(),
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .optional(),
  chairNumbers: Joi.array()
    .items(Joi.number().integer().min(1))
    .optional(),
  type: Joi.string().valid("single", "double", "manual").optional(),
  internetType: Joi.string().valid("standard", "premium").optional(),
});

// Cashier session
const createSessionSchema = Joi.object({
  cashierId: Joi.string().required(),
});

// Generic validate middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    req.body = value; // use sanitized values
    next();
  };
};

module.exports = {
  validate,
  loginSchema,
  verifyCodeSchema,
  createUserSchema,
  updateUserSchema,
  productSchema,
  settingsSchema,
  createReservationSchema,
  addItemSchema,
  closeReservationSchema,
  manualInvoiceSchema,
  updateInvoiceSchema,
  createSessionSchema,
};
