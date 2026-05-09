const Settings = require("../models/Settings");

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.getSettings();
    const allowedUpdates = [
      "singlePriceStandard",
      "singlePricePremium",
      "doublePriceStandard",
      "doublePricePremium",
      "discountPercent",
      "minutesUnit",
      "roundUpThreshold",
      "cafeName",
      "cafePhone",
      "currency",
      "totalChairs",
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
