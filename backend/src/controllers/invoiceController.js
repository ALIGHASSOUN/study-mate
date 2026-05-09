const Invoice = require("../models/Invoice");
const Reservation = require("../models/Reservation");
const Settings = require("../models/Settings");

// Helper to generate sequential invoice number
const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  const lastNum = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split("-")[2])
    : 0;
  const newNum = (lastNum + 1).toString().padStart(5, "0");
  return `INV-${new Date().getFullYear()}-${newNum}`;
};

// Close reservation and create invoice
const closeReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation || reservation.status !== "active") {
      return res.status(404).json({ message: "Active reservation not found" });
    }

    const { applyDiscount, discountPercentOverride } = req.body; // discountPercentOverride يأتي من frontend (إذا تغير)
    const settings = await Settings.getSettings();
    let discountPercent = reservation.discountPercent; // الافتراضي من الحجز

    if (applyDiscount && discountPercentOverride !== undefined) {
      discountPercent = discountPercentOverride;
    } else if (!applyDiscount) {
      discountPercent = 0;
    }

    // حساب الوقت والوحدات
    const start = new Date(reservation.startedAt);
    const end = new Date();
    const durationMs = end - start;
    const durationMinutes = Math.floor(durationMs / 60000);
    const minutesUnit = settings.minutesUnit; // 10
    const roundUpThreshold = settings.roundUpThreshold; // 7

    let billedUnits = Math.floor(durationMinutes / minutesUnit);
    const remainder = durationMinutes % minutesUnit;
    if (remainder >= roundUpThreshold) billedUnits += 1;

    const pricePerHour = reservation.pricePerHour;
    const timeCost = billedUnits * (pricePerHour / 6); // لأن الساعة = 6 وحدات (10 دقائق)

    // حساب تكلفة الطلبات
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
      date: new Date(start.toDateString()), // لتجميع اليوم
    });

    // تحديث حالة reservation إلى closed
    reservation.status = "closed";
    await reservation.save();

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get invoice by ID (للطباعة)
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { closeReservation, getInvoiceById };
