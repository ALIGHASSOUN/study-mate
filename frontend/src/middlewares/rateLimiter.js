const rateLimit = require("express-rate-limit");

// Strict rate limiter for login and code verification only
// 10 attempts per IP per 15 minutes (generous enough for development,
// strict enough for 4-digit brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed requests
  skipSuccessfulRequests: true,
});

module.exports = { authLimiter };
