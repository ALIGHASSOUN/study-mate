const express = require("express");
const router = express.Router();
const {
  loginStep1,
  verifyCode,
  getMe,
  logout,
  createCashierSession,
  getActiveSession,
  endSession,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// Public
router.post("/login", loginStep1);
router.post("/verify-code", verifyCode);

// Protected
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

// Cashier session management (admin only)
router.post(
  "/cashier-sessions",
  protect,
  authorize("admin"),
  createCashierSession,
);
router.get(
  "/cashier-sessions/active",
  protect,
  authorize("admin"),
  getActiveSession,
);
router.post(
  "/cashier-sessions/:id/end",
  protect,
  authorize("admin"),
  endSession,
);

module.exports = router;
