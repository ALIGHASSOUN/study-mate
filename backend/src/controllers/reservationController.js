const Reservation = require("../models/Reservation");
const Product = require("../models/Product");
const Settings = require("../models/Settings");

// Helper: get price per hour based on type + internetType
const getPricePerHour = async (type, internetType) => {
  const settings = await Settings.getSettings();
  if (type === "single") {
    return internetType === "standard"
      ? settings.singlePriceStandard
      : settings.singlePricePremium;
  } else {
    return internetType === "standard"
      ? settings.doublePriceStandard
      : settings.doublePricePremium;
  }
};

// @desc    Get all active reservations
// @route   GET /api/reservations/active
const getActiveReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ status: "active" }).sort({
      startedAt: -1,
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new reservation
// @route   POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const {
      chairNumbers,
      type,
      internetType,
      discountPercent,
      cashierSessionId,
    } = req.body;
    if (!chairNumbers || !type || !internetType || !cashierSessionId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (type === "single" && chairNumbers.length !== 1) {
      return res
        .status(400)
        .json({ message: "Single chair requires exactly one chair number" });
    }
    if (type === "double" && chairNumbers.length !== 2) {
      return res
        .status(400)
        .json({ message: "Double chair requires two adjacent numbers" });
    }
    if (
      type === "double" &&
      Math.abs(chairNumbers[1] - chairNumbers[0]) !== 1
    ) {
      return res
        .status(400)
        .json({ message: "Double chairs must be adjacent" });
    }

    // Check if chairs are already occupied
    const activeReservations = await Reservation.find({ status: "active" });
    const occupiedChairs = activeReservations.flatMap((r) => r.chairNumbers);
    const isOccupied = chairNumbers.some((cn) => occupiedChairs.includes(cn));
    if (isOccupied)
      return res
        .status(409)
        .json({ message: "One or more chairs already occupied" });

    const pricePerHour = await getPricePerHour(type, internetType);
    const settings = await Settings.getSettings();
    const finalDiscount =
      discountPercent !== undefined
        ? discountPercent
        : settings.discountPercent;

    const reservation = await Reservation.create({
      chairNumbers,
      type,
      internetType,
      pricePerHour,
      discountPercent: finalDiscount,
      startedAt: new Date(),
      cashierId: req.user.userId,
      cashierSessionId,
    });
    res.status(201).json(reservation);
  } catch (error) {
    // إذا حصل duplicate key (race condition تم منعه بواسطة unique index)
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "One or more chairs already occupied" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to reservation (deduct stock)
// @route   POST /api/reservations/:id/items
const addItem = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      status: "active",
    });
    if (!reservation)
      return res.status(404).json({ message: "Active reservation not found" });

    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive)
      return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity)
      return res.status(400).json({ message: "Insufficient stock" });

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    // Add item to reservation
    reservation.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
    });
    await reservation.save();
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from reservation (restock)
// @route   DELETE /api/reservations/:id/items/:itemId
const removeItem = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      status: "active",
    });
    if (!reservation)
      return res.status(404).json({ message: "Active reservation not found" });

    const item = reservation.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Restock product
    const product = await Product.findById(item.productId);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }

    // Remove item
    reservation.items.pull({ _id: req.params.itemId });
    await reservation.save();
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveReservations,
  createReservation,
  addItem,
  removeItem,
};
