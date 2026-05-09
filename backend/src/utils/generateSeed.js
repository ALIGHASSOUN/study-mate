// require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();
const connectDB = require("../config/db");

const seedAdmin = async () => {
  try {
    await connectDB();
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log("Admin user created: username=admin, password=admin123");
    } else {
      console.log("Admin already exists");
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
