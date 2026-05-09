const express = require("express");
const router = express.Router();
const {
  closeReservation,
  getInvoiceById,
} = require("../controllers/invoiceController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/reservations/:id/close", protect, closeReservation);
router.get("/:id", protect, getInvoiceById);

module.exports = router;
