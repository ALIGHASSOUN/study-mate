const express = require("express");
const router = express.Router();
const {
  getCashiers,
  createCashier,
  updateCashier,
  deleteCashier,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.get("/", protect, authorize("admin"), getCashiers);
router.post("/", protect, authorize("admin"), createCashier);
router.put("/:id", protect, authorize("admin"), updateCashier);
router.delete("/:id", protect, authorize("admin"), deleteCashier);

module.exports = router;
