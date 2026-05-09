const express = require("express");
const router = express.Router();
const {
  getActiveReservations,
  createReservation,
  addItem,
  removeItem,
  closeReservation,
} = require("../controllers/reservationController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/active", protect, getActiveReservations);
router.post("/", protect, createReservation);
router.post("/:id/items", protect, addItem);
router.delete("/:id/items/:itemId", protect, removeItem);
router.post("/:id/close", protect, closeReservation);

module.exports = router;
