const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  addedAt: { type: Date, default: Date.now },
});

const reservationSchema = new mongoose.Schema(
  {
    chairNumbers: [{ type: Number, required: true }],
    type: { type: String, enum: ["single", "double"], required: true },
    internetType: {
      type: String,
      enum: ["standard", "premium"],
      required: true,
    },
    pricePerHour: { type: Number, required: true },
    discountPercent: { type: Number, required: true, default: 0 },
    startedAt: { type: Date, default: Date.now },
    items: [itemSchema],
    status: { type: String, enum: ["active", "closing", "closed"], default: "active" },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashierSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashierSession",
      required: true,
    },
  },
  { timestamps: true },
);

// 🔒 Partial unique index: منع وجود حجزين نشطين لنفس الكرسي
// هذا يمنع التكرار على مستوى قاعدة البيانات حتى لو race condition حصل
reservationSchema.index(
  { chairNumbers: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["active", "closing"] } },
  }
);

module.exports =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);
