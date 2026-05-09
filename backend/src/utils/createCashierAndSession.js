require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const CashierSession = require("../models/CashierSession");
const connectDB = require("../config/db");

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const createSession = async (username) => {
  try {
    await connectDB();
    const cashier = await User.findOne({
      username,
      role: "cashier",
      isActive: true,
    });
    if (!cashier) {
      console.log(`❌ Cashier "${username}" not found.`);
      process.exit(1);
    }
    // إنهاء أي جلسة نشطة حالياً
    await CashierSession.updateMany(
      { isActive: true },
      { isActive: false, endedAt: new Date(), endedBy: "replaced" },
    );
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 18);
    const session = await CashierSession.create({
      cashierId: cashier._id,
      code,
      expiresAt,
      createdBy: cashier._id, // يمكن تغييره لاحقاً
    });
    console.log(`✅ Session created for ${username}`);
    console.log(`📌 4-digit code: ${code}`);
    console.log(`⏰ Expires at: ${expiresAt}`);
    console.log(`🆔 Session ID: ${session._id}`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const username = process.argv[2];
if (!username) {
  console.log("Usage: node createSessionForCashier.js <cashier_username>");
  process.exit(1);
}
createSession(username);
