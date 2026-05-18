const express = require("express");
const router = express.Router();
const {
  closeReservation,
  getInvoices,
  getInvoicesByDay,
  getInvoiceById,
  createManualInvoice,
  updateInvoice,
  deleteInvoice,
} = require("../controllers/invoiceController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  validate,
  closeReservationSchema,
  manualInvoiceSchema,
  updateInvoiceSchema,
} = require("../validators/schemas");

// ⚠️  المسارات الثابتة يجب أن تأتي قبل المسارات الديناميكية /:id

// Close reservation -> create invoice (cashier + admin)
router.post(
  "/reservations/:id/close",
  protect,
  validate(closeReservationSchema),
  closeReservation
);

// List all invoices (admin only)
router.get("/", protect, authorize("admin"), getInvoices);

// Invoices by specific day — MUST be before /:id
router.get("/by-day/:date", protect, authorize("admin"), getInvoicesByDay);

// Create manual invoice (admin only)
router.post(
  "/manual",
  protect,
  authorize("admin"),
  validate(manualInvoiceSchema),
  createManualInvoice
);

// Get single invoice by ID — accessible by cashier too (for print)
// هذا يجب أن يأتي بعد /by-day/:date و /manual
router.get("/:id", protect, getInvoiceById);

// Update invoice (admin only)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validate(updateInvoiceSchema),
  updateInvoice
);

// Delete invoice (admin only)
router.delete("/:id", protect, authorize("admin"), deleteInvoice);

module.exports = router;
