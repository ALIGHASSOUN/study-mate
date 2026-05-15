const express = require("express");
const router = express.Router();
const {
  getCashiers,
  getAllStaff,
  createCashier,
  updateCashier,
  deleteCashier,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  validate,
  createUserSchema,
  updateUserSchema,
} = require("../validators/schemas");

// Staff (admins + cashiers) — accessible by any logged-in user (for on-house dropdown)
router.get("/staff", protect, getAllStaff);

router.get("/", protect, authorize("admin"), getCashiers);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createUserSchema),
  createCashier
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validate(updateUserSchema),
  updateCashier
);
router.delete("/:id", protect, authorize("admin"), deleteCashier);

module.exports = router;
