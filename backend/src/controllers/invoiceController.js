const Invoice = require("../models/Invoice");
const Reservation = require("../models/Reservation");
const Settings = require("../models/Settings");
const AuditLog = require("../models/AuditLog");

// Helper to generate sequential invoice number
const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  const year = new Date().getFullYear();
  let nextNumber = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split("-");
    if (parts.length === 3) {
      nextNumber = parseInt(parts[2]) + 1;
    }
  }
  return `INV-${year}-${nextNumber.toString().padStart(5, "0")}`;
};

// @desc    Close reservation and create invoice
// @route   POST /api/invoices/reservations/:id/close
const closeReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation || reservation.status !== "active") {
      return res.status(404).json({ message: "Active reservation not found" });
    }

    const { applyDiscount, discountPercentOverride } = req.body;
    const settings = await Settings.getSettings();
    let discountPercent = reservation.discountPercent;

    if (applyDiscount && discountPercentOverride !== undefined) {
      discountPercent = discountPercentOverride;
    } else if (!applyDiscount) {
      discountPercent = 0;
    }

    const start = new Date(reservation.startedAt);
    const end = new Date();
    const durationMs = end - start;
    const durationMinutes = Math.floor(durationMs / 60000);
    const minutesUnit = settings.minutesUnit || 10;
    const roundUpThreshold = settings.roundUpThreshold || 7;

    let billedUnits = Math.floor(durationMinutes / minutesUnit);
    const remainder = durationMinutes % minutesUnit;
    if (remainder >= roundUpThreshold) billedUnits += 1;

    const pricePerHour = reservation.pricePerHour;
    const timeCost = billedUnits * (pricePerHour / (60 / minutesUnit));

    let itemsCost = 0;
    const finalItems = reservation.items.map((item) => {
      itemsCost += item.price * item.quantity;
      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      };
    });

    const subtotal = timeCost + itemsCost;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      reservationId: reservation._id,
      chairNumbers: reservation.chairNumbers,
      type: reservation.type,
      internetType: reservation.internetType || "standard",
      startedAt: reservation.startedAt,
      endedAt: end,
      durationMinutes,
      billedUnits,
      timeCost,
      items: finalItems,
      itemsCost,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      cashierId: reservation.cashierId,
      date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    });

    reservation.status = "closed";
    await reservation.save();

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all invoices grouped by day
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const invoices = await Invoice.find()
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("cashierId", "username role");

    const total = await Invoice.countDocuments();

    const grouped = {};
    invoices.forEach((inv) => {
      const dayKey = inv.date; // already "YYYY-MM-DD" string
      if (!grouped[dayKey]) {
        grouped[dayKey] = { date: dayKey, invoices: [], dayTotal: 0, count: 0 };
      }
      grouped[dayKey].invoices.push(inv);
      grouped[dayKey].dayTotal += inv.total;
      grouped[dayKey].count += 1;
    });

    const days = Object.values(grouped).sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    res.json({ days, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get invoices for a specific day
// @route   GET /api/invoices/by-day/:date
const getInvoicesByDay = async (req, res) => {
  try {
    // date field is now a "YYYY-MM-DD" string, so exact match
    const dateStr = req.params.date; // e.g. "2025-05-09"

    const invoices = await Invoice.find({ date: dateStr })
      .sort({ createdAt: -1 })
      .populate("cashierId", "username role");

    const dayTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
    res.json({ date: dateStr, invoices, dayTotal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "cashierId",
      "username role"
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually add an invoice
// @route   POST /api/invoices/manual
const createManualInvoice = async (req, res) => {
  try {
    const {
      chairNumbers,
      type,
      internetType,
      startedAt,
      endedAt,
      items,
      discountPercent,
    } = req.body;

    const settings = await Settings.getSettings();
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const durationMinutes = Math.floor((end - start) / 60000);
    const minutesUnit = settings.minutesUnit || 10;
    const roundUpThreshold = settings.roundUpThreshold || 7;

    let billedUnits = Math.floor(durationMinutes / minutesUnit);
    const remainder = durationMinutes % minutesUnit;
    if (remainder >= roundUpThreshold) billedUnits += 1;

    let pricePerHour;
    const iType = internetType || "standard";
    if (type === "single") {
      pricePerHour =
        iType === "premium"
          ? settings.singlePricePremium
          : settings.singlePriceStandard;
    } else if (type === "double") {
      pricePerHour =
        iType === "premium"
          ? settings.doublePricePremium
          : settings.doublePriceStandard;
    } else {
      pricePerHour = settings.singlePriceStandard;
    }

    const timeCost = billedUnits * (pricePerHour / (60 / minutesUnit));
    let itemsCost = 0;
    const finalItems = (items || []).map((item) => {
      itemsCost += item.price * item.quantity;
      return item;
    });

    const subtotal = timeCost + itemsCost;
    const dp = discountPercent || 0;
    const discountAmount = (subtotal * dp) / 100;
    const total = subtotal - discountAmount;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      reservationId: null,
      chairNumbers: chairNumbers || [],
      type: type || "manual",
      internetType: iType,
      startedAt: start,
      endedAt: end,
      durationMinutes,
      billedUnits,
      timeCost,
      items: finalItems,
      itemsCost,
      subtotal,
      discountPercent: dp,
      discountAmount,
      total,
      cashierId: req.user.userId,
      date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    });

    await AuditLog.create({
      userId: req.user.userId,
      action: "invoice_manual_create",
      targetType: "Invoice",
      targetId: invoice._id,
      before: null,
      after: invoice.toObject(),
      ip: req.ip,
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit invoice
// @route   PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const before = invoice.toObject();

    const allowedUpdates = [
      "discountPercent",
      "items",
      "chairNumbers",
      "type",
      "internetType",
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    });

    let itemsCost = 0;
    invoice.items.forEach((item) => {
      itemsCost += item.price * item.quantity;
    });
    invoice.itemsCost = itemsCost;
    invoice.subtotal = invoice.timeCost + itemsCost;
    invoice.discountAmount =
      (invoice.subtotal * invoice.discountPercent) / 100;
    invoice.total = invoice.subtotal - invoice.discountAmount;

    await invoice.save();

    await AuditLog.create({
      userId: req.user.userId,
      action: "invoice_edit",
      targetType: "Invoice",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
      ip: req.ip,
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const before = invoice.toObject();

    await AuditLog.create({
      userId: req.user.userId,
      action: "invoice_delete",
      targetType: "Invoice",
      targetId: invoice._id,
      before,
      after: null,
      ip: req.ip,
    });

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  closeReservation,
  getInvoices,
  getInvoicesByDay,
  getInvoiceById,
  createManualInvoice,
  updateInvoice,
  deleteInvoice,
};
