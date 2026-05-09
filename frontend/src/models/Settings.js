const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Single chair prices
    singlePriceStandard: {
      type: Number,
      required: true,
      default: 3000,
    },
    singlePricePremium: {
      type: Number,
      required: true,
      default: 5000,
    },
    // Double chair prices
    doublePriceStandard: {
      type: Number,
      required: true,
      default: 5000,
    },
    doublePricePremium: {
      type: Number,
      required: true,
      default: 8000,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    minutesUnit: {
      type: Number,
      default: 10,
    },
    roundUpThreshold: {
      type: Number,
      default: 7,
    },
    cafeName: {
      type: String,
      default: "Study Cafe",
    },
    cafePhone: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "SYP",
    },
    totalChairs: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);

// Ensure only one document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// ✅ تجنب إعادة تعريف النموذج
module.exports =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
