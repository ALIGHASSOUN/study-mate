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

// Close reservation -> create invoice (cashier + admin)
router.post("/reservations/:id/close", protect, closeReservation);

// Invoice CRUD (admin only, except getById for printing)
router.get("/", protect, authorize("admin"), getInvoices);
router.get("/by-day/:date", protect, authorize("admin"), getInvoicesByDay);
router.post("/manual", protect, authorize("admin"), createManualInvoice);
router.put("/:id", protect, authorize("admin"), updateInvoice);
router.delete("/:id", protect, authorize("admin"), deleteInvoice);

// Get by ID - accessible by cashier too (for print)
router.get("/:id", protect, getInvoiceById);

module.exports = router;
