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

// Create — accessible by cashier + admin (anyone logged in)
router.post("/", protect, createOnHouseInvoice);

// Read & manage — admin only
router.get("/", protect, authorize("admin"), getAllOnHouseInvoices);
router.get("/summary", protect, authorize("admin"), getOnHouseSummary);
router.get("/by-user/:userId", protect, authorize("admin"), getOnHouseByUser);
router.put("/:id", protect, authorize("admin"), updateOnHouseInvoice);
router.delete("/:id", protect, authorize("admin"), deleteOnHouseInvoice);

module.exports = router;
