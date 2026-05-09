const User = require("../models/User");
const CashierSession = require("../models/CashierSession");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper: generate JWT
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "18h",
  });
};

// Helper: generate 4-digit random code
const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Login step 1: username + password
// @route   POST /api/auth/login
// @access  Public
const loginStep1 = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
      isActive: true,
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If admin, directly issue JWT
    if (user.role === "admin") {
      const token = generateToken(user._id, user.role);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 18 * 60 * 60 * 1000,
      });
      return res.json({ role: user.role, message: "Login successful" });
    }

    // If cashier, check for active session
    const activeSession = await CashierSession.findOne({
      cashierId: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    if (!activeSession) {
      return res.status(403).json({
        message: "No active cashier session. Ask admin to create one.",
      });
    }

    // Cashier needs second step: return sessionId (to store temporarily)
    // We'll store a temporary token or just require code verification
    // For simplicity: return sessionId and require code
    return res.json({
      role: user.role,
      sessionId: activeSession._id,
      requiresCode: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login step 2: verify 4-digit code (cashier only)
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    const { sessionId, code } = req.body;
    if (!sessionId || !code) {
      return res.status(400).json({ message: "Session ID and code required" });
    }

    const session =
      await CashierSession.findById(sessionId).populate("cashierId");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (!session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired or inactive" });
    }
    if (session.code !== code) {
      return res.status(401).json({ message: "Invalid code" });
    }

    // Generate JWT for cashier
    const token = generateToken(session.cashierId._id, session.cashierId.role);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 18 * 60 * 60 * 1000,
    });
    res.json({
      role: session.cashierId.role,
      message: "Verified successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get current user data /me
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out" });
};

// @desc    Create cashier session (Admin only)
// @route   POST /api/cashier-sessions
// @access  Admin
const createCashierSession = async (req, res) => {
  try {
    const { cashierId } = req.body;
    const cashier = await User.findOne({
      _id: cashierId,
      role: "cashier",
      isActive: true,
    });
    if (!cashier) {
      return res.status(404).json({ message: "Cashier not found or inactive" });
    }

    // End any currently active session (any cashier)
    await CashierSession.updateMany(
      { isActive: true },
      { isActive: false, endedAt: new Date(), endedBy: "replaced" },
    );

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 18); // 18 hours lifetime

    const newSession = await CashierSession.create({
      cashierId: cashier._id,
      code,
      expiresAt,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      sessionId: newSession._id,
      cashier: cashier.username,
      code, // Normally show this to admin only (to give to cashier)
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get currently active session (any cashier)
// @route   GET /api/cashier-sessions/active
// @access  Admin
const getActiveSession = async (req, res) => {
  try {
    const session = await CashierSession.findOne({ isActive: true })
      .populate("cashierId", "username")
      .populate("createdBy", "username");
    if (!session) {
      return res.json({ session: null });
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    End a session manually
// @route   POST /api/cashier-sessions/:id/end
// @access  Admin
const endSession = async (req, res) => {
  try {
    const session = await CashierSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    session.isActive = false;
    session.endedAt = new Date();
    session.endedBy = "admin";
    await session.save();
    res.json({ message: "Session ended" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  loginStep1,
  verifyCode,
  getMe,
  logout,
  createCashierSession,
  getActiveSession,
  endSession,
};
