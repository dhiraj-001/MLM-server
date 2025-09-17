import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: String,
      default: "admin",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCashback: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    totalActiveDays: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
      defaul: null,
    },
    canWithdraw: {
      type: Boolean,
      default: true,
    },
    withdrawBlockReason: {
      type: String,
      defaul: null,
    },
    editedByAdmin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate token
userSchema.methods.generateToken = async function () {
  try {
    const token = jwt.sign(
      { _id: this._id, email: this.email, isAdmin: this.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return token;
  } catch (error) {
    console.error(error);
    throw new Error("Token generation failed");
  }
};

const User = mongoose.model("User", userSchema);
export default User;
