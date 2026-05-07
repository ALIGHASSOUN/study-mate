const mongoose = require("mongoose");

const cashierSessionSchema = new mongoose.Schema({
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: { type: String, required: true }, // الكود المكون من 4 أرقام
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // 18 ساعة كما في الخطة
  endedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("CashierSession", cashierSessionSchema);
