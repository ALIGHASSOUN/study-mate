const express = require("express");
const router = express.Router();
const {
  createOnHouseInvoice,
  getAllOnHouseInvoices,
  getOnHouseByUser,
  getOnHouseSummary,
  updateOnHouseInvoice,
  deleteOnHouseInvoice,
} = require("../controllers/onHouseController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// ⚠️  المسارات الثابتة يجب أن تأتي قبل الديناميكية /:id
// وإلا Express يفسّر "summary" و "by-user" كـ :id

// Create — accessible by cashier + admin
router.post("/", protect, createOnHouseInvoice);

// Get all (grouped by day) — admin only
router.get("/", protect, authorize("admin"), getAllOnHouseInvoices);

// Summary per user (cards page) — MUST be before /:id
router.get("/summary", protect, authorize("admin"), getOnHouseSummary);

// By specific user — MUST be before /:id
router.get("/by-user/:userId", protect, authorize("admin"), getOnHouseByUser);

// Update — admin only  (/:id يأتي بعد المسارات الثابتة)
router.put("/:id", protect, authorize("admin"), updateOnHouseInvoice);

// Delete — admin only
router.delete("/:id", protect, authorize("admin"), deleteOnHouseInvoice);

module.exports = router;
