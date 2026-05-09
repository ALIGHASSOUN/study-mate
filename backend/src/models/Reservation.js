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
    status: { type: String, enum: ["active", "closed"], default: "active" },
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

module.exports =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);
