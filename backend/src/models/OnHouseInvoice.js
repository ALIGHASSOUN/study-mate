const mongoose = require("mongoose");

/**
 * OnHouseInvoice - فواتير الضيافة (على حساب المقهى)
 *
 * - لا تضاف للإيرادات (لا تظهر في dailyRevenue ولا في totals).
 * - تنقص من المخزون عند الإنشاء (وترجع للمخزون عند الحذف).
 * - تربط بمستفيد واحد (forUserId): كاشير أو أدمن.
 * - تربط بمن سجّلها (recordedById): الكاشير/الأدمن اللي ضغط حفظ.
 */
const onHouseInvoiceSchema = new mongoose.Schema(
  {
    // المستفيد (لمين الضيافة)
    forUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // اللي سجّل الضيافة (قد يكون = forUserId أو لا)
    recordedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 }, // snapshot للسعر (للعرض فقط - لا يضاف للإيرادات)
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    // مجموع تقديري (snapshot) - فقط لعرض كم كلّفت لو كانت مبيعاً، لا تدخل في الإيرادات
    totalCost: { type: Number, required: true, default: 0 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OnHouseInvoice ||
  mongoose.model("OnHouseInvoice", onHouseInvoiceSchema);
