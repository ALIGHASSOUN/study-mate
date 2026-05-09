const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },
    chairNumbers: [{ type: Number, required: true }],
    type: {
      type: String,
      enum: ["single", "double", "manual"],
      required: true,
    },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    billedUnits: { type: Number, required: true },
    timeCost: { type: Number, required: true },
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    itemsCost: { type: Number, required: true, default: 0 },
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true, index: true }, // day grouping
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
