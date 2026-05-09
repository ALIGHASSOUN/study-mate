// require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const connectDB = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();

const createCashier = async () => {
  try {
    await connectDB();

    const cashierUsername = "cashier2";
    const cashierPassword = "cashier123";

    const existing = await User.findOne({ username: cashierUsername });
    if (existing) {
      console.log(`Cashier '${cashierUsername}' already exists.`);
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(cashierPassword, 10);
    const cashier = await User.create({
      username: cashierUsername,
      passwordHash: hashedPassword,
      role: "cashier",
      isActive: true,
    });

    console.log(
      `✅ Cashier created: username=${cashierUsername}, password=${cashierPassword}, role=cashier`,
    );
    console.log(`User ID: ${cashier._id}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createCashier();
