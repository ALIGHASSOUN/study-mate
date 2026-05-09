const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Get all cashiers (only cashiers, not admin)
// @route   GET /api/users
// @access  Admin
const getCashiers = async (req, res) => {
  try {
    const users = await User.find({ role: "cashier", isActive: true }).select(
      "-passwordHash",
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new cashier
// @route   POST /api/users
// @access  Admin
const createCashier = async (req, res) => {
  try {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hashedPassword,
      role: "cashier",
      isActive: true,
    });
    res
      .status(201)
      .json({ _id: user._id, username: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cashier (password or isActive)
// @route   PUT /api/users/:id
// @access  Admin
const updateCashier = async (req, res) => {
  try {
    const { password, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete cashier
// @route   DELETE /api/users/:id
// @access  Admin
const deleteCashier = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = false;
    await user.save();
    res.json({ message: "Cashier deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCashiers, createCashier, updateCashier, deleteCashier };
