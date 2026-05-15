const OnHouseInvoice = require("../models/OnHouseInvoice");
const Product = require("../models/Product");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Helper: format date as YYYY-MM-DD
const formatDay = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

// @desc    Create on-house invoice (cashier + admin)
// @route   POST /api/on-house
const createOnHouseInvoice = async (req, res) => {
  try {
    const { forUserId, items, description } = req.body;

    if (!forUserId)
      return res.status(400).json({ message: "forUserId is required" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "At least one item is required" });

    // Verify the beneficiary user exists
    const forUser = await User.findById(forUserId);
    if (!forUser)
      return res.status(404).json({ message: "Beneficiary user not found" });

    // Verify stock for each item and build final items
    const finalItems = [];
    let totalCost = 0;

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product || !product.isActive) {
        return res
          .status(400)
          .json({ message: `Product not found or inactive: ${it.productId}` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (available: ${product.stock})`,
        });
      }
      finalItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
      });
      totalCost += product.price * it.quantity;
    }

    // Deduct stock
    for (const it of finalItems) {
      await Product.updateOne(
        { _id: it.productId },
        { $inc: { stock: -it.quantity } }
      );
    }

    const invoice = await OnHouseInvoice.create({
      forUserId,
      recordedById: req.user.userId,
      items: finalItems,
      totalCost,
      description: description || "",
      date: formatDay(new Date()),
    });

    await AuditLog.create({
      userId: req.user.userId,
      action: "onhouse_create",
      targetType: "OnHouseInvoice",
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

// @desc    Get all on-house invoices grouped by day (admin only)
// @route   GET /api/on-house
const getAllOnHouseInvoices = async (req, res) => {
  try {
    const invoices = await OnHouseInvoice.find()
      .sort({ date: -1, createdAt: -1 })
      .populate("forUserId", "username role")
      .populate("recordedById", "username role");

    const grouped = {};
    invoices.forEach((inv) => {
      const dayKey = inv.date;
      if (!grouped[dayKey]) {
        grouped[dayKey] = { date: dayKey, invoices: [], count: 0, dayCost: 0 };
      }
      grouped[dayKey].invoices.push(inv);
      grouped[dayKey].count += 1;
      grouped[dayKey].dayCost += inv.totalCost;
    });

    const days = Object.values(grouped).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    res.json({ days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get on-house invoices for a specific user (admin only)
// @route   GET /api/on-house/by-user/:userId
const getOnHouseByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("username role");
    if (!user) return res.status(404).json({ message: "User not found" });

    const invoices = await OnHouseInvoice.find({ forUserId: userId })
      .sort({ date: -1, createdAt: -1 })
      .populate("recordedById", "username role");

    // Group by day
    const grouped = {};
    invoices.forEach((inv) => {
      const dayKey = inv.date;
      if (!grouped[dayKey]) {
        grouped[dayKey] = { date: dayKey, invoices: [], count: 0, dayCost: 0 };
      }
      grouped[dayKey].invoices.push(inv);
      grouped[dayKey].count += 1;
      grouped[dayKey].dayCost += inv.totalCost;
    });

    const days = Object.values(grouped).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    res.json({ user, days });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get summary per user (admin only) - for the user cards page
// @route   GET /api/on-house/summary
const getOnHouseSummary = async (req, res) => {
  try {
    // Aggregate: group by forUserId, count, totalCost
    const summary = await OnHouseInvoice.aggregate([
      {
        $group: {
          _id: "$forUserId",
          totalInvoices: { $sum: 1 },
          totalCost: { $sum: "$totalCost" },
          lastDate: { $max: "$date" },
        },
      },
    ]);

    // Populate user info
    const userIds = summary.map((s) => s._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "username role isActive"
    );
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const result = summary
      .map((s) => ({
        user: userMap[s._id.toString()] || null,
        totalInvoices: s.totalInvoices,
        totalCost: s.totalCost,
        lastDate: s.lastDate,
      }))
      .filter((r) => r.user); // exclude orphan records

    // Sort by totalCost desc
    result.sort((a, b) => b.totalCost - a.totalCost);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update on-house invoice (admin only)
// @route   PUT /api/on-house/:id
const updateOnHouseInvoice = async (req, res) => {
  try {
    const invoice = await OnHouseInvoice.findById(req.params.id);
    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    const before = invoice.toObject();
    const { description, items } = req.body;

    // If items change, we need to adjust stock (restore old, deduct new)
    if (items && Array.isArray(items)) {
      // Restore old items to stock
      for (const oldIt of invoice.items) {
        if (oldIt.productId) {
          await Product.updateOne(
            { _id: oldIt.productId },
            { $inc: { stock: oldIt.quantity } }
          );
        }
      }

      // Verify and deduct new items
      const finalItems = [];
      let totalCost = 0;
      for (const it of items) {
        const product = await Product.findById(it.productId);
        if (!product || !product.isActive) {
          // Roll back: re-deduct what we restored (best effort)
          for (const oldIt of invoice.items) {
            if (oldIt.productId) {
              await Product.updateOne(
                { _id: oldIt.productId },
                { $inc: { stock: -oldIt.quantity } }
              );
            }
          }
          return res
            .status(400)
            .json({ message: `Product not found: ${it.productId}` });
        }
        if (product.stock < it.quantity) {
          // Roll back
          for (const oldIt of invoice.items) {
            if (oldIt.productId) {
              await Product.updateOne(
                { _id: oldIt.productId },
                { $inc: { stock: -oldIt.quantity } }
              );
            }
          }
          return res.status(400).json({
            message: `Not enough stock for ${product.name}`,
          });
        }
        finalItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: it.quantity,
        });
        totalCost += product.price * it.quantity;
      }

      for (const it of finalItems) {
        await Product.updateOne(
          { _id: it.productId },
          { $inc: { stock: -it.quantity } }
        );
      }

      invoice.items = finalItems;
      invoice.totalCost = totalCost;
    }

    if (description !== undefined) invoice.description = description;

    await invoice.save();

    await AuditLog.create({
      userId: req.user.userId,
      action: "onhouse_edit",
      targetType: "OnHouseInvoice",
      targetId: invoice._id,
      before,
      after: invoice.toObject(),
      ip: req.ip,
    });

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete on-house invoice (admin only) — restores stock
// @route   DELETE /api/on-house/:id
const deleteOnHouseInvoice = async (req, res) => {
  try {
    const invoice = await OnHouseInvoice.findById(req.params.id);
    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    // Restore stock
    for (const it of invoice.items) {
      if (it.productId) {
        await Product.updateOne(
          { _id: it.productId },
          { $inc: { stock: it.quantity } }
        );
      }
    }

    const before = invoice.toObject();
    await AuditLog.create({
      userId: req.user.userId,
      action: "onhouse_delete",
      targetType: "OnHouseInvoice",
      targetId: invoice._id,
      before,
      after: null,
      ip: req.ip,
    });

    await OnHouseInvoice.findByIdAndDelete(req.params.id);

    res.json({ message: "On-house invoice deleted, stock restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOnHouseInvoice,
  getAllOnHouseInvoices,
  getOnHouseByUser,
  getOnHouseSummary,
  updateOnHouseInvoice,
  deleteOnHouseInvoice,
};
