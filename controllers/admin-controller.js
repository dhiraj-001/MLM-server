import User from "../models/user-model.js";
import Contact from "../models/contact-form-model.js";
import Deposit from "../models/deposit-model.js";
import Withdrawal from "../models/withdrawal-model.js";
import WithdrawalAccount from "../models/withdrawalAccount-model.js";
import QuizSubmission from "../models/ques-submission-modal.js";
import { createNotification } from "./notification-controller.js";
import { AdminDepositSchema } from "../validators/deposit-validator.js";
import mongoose from "mongoose"; // Import mongoose
import Notification from "../models/notification-model.js";
import bcrypt from "bcryptjs";

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 });
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getAllContactFormData = async (req, res, next) => {
  try {
    const contactFormData = await Contact.find({});
    if (!contactFormData) {
      return res.status(404).json({ message: "No contact form data found" });
    }
    res.status(200).json(contactFormData);
  } catch (error) {
    next(error);
  }
};

const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate("user", "email phone");
    res.status(200).json(deposits);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deposits" });
  }
};

const updateDepositStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    if (deposit.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only update pending deposits" });
    }

    deposit.status = status;
    await deposit.save();

    if (status === "approved") {
      const user = await User.findById(deposit.user);
      user.balance += deposit.amount;
      user.depositBalance += deposit.amount;
      await user.save();

      // Create notification for approved deposit
      await createNotification(
        deposit.user,
        "Deposit Approved",
        `Your deposit of $${deposit.amount.toFixed(
          2
        )} has been approved and added to your balance.`,
        "deposit",
        { transactionId: deposit._id, amount: deposit.amount }
      );
    } else if (status === "rejected") {
      // Create notification for rejected deposit
      await createNotification(
        deposit.user,
        "Deposit Rejected",
        `Your deposit of $${deposit.amount.toFixed(
          2
        )} has been rejected. Please contact support for details.`,
        "deposit",
        { transactionId: deposit._id, amount: deposit.amount }
      );
    }

    res.status(200).json({ message: `Deposit ${status}`, deposit });
  } catch (error) {
    console.error("Error updating deposit status:", error);
    res.status(500).json({ message: "Error updating deposit status" });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate("user", "email phone");
    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching withdrawals" });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only update pending withdrawals" });
    }

    if (status === "approved") {
      const user = await User.findById(withdrawal.user);
      if (user.balance < withdrawal.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      user.balance -= withdrawal.amount;
      await user.save();

      // Create notification for approved withdrawal
      await createNotification(
        withdrawal.user,
        "Withdrawal Approved",
        `Your withdrawal request of $${withdrawal.amount.toFixed(
          2
        )} has been approved and processed.`,
        "withdrawal",
        { transactionId: withdrawal._id, amount: withdrawal.amount }
      );
    } else if (status === "rejected") {
      // Create notification for rejected withdrawal
      await createNotification(
        withdrawal.user,
        "Withdrawal Rejected",
        `Your withdrawal request of $${withdrawal.amount.toFixed(
          2
        )} has been rejected. Please contact support for details.`,
        "withdrawal",
        { transactionId: withdrawal._id, amount: withdrawal.amount }
      );
    }

    withdrawal.status = status;
    await withdrawal.save();

    res.status(200).json({ message: `Withdrawal ${status}`, withdrawal });
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    res.status(500).json({ message: "Error updating withdrawal status" });
  }
};

const getAllTeamMembers = async (req, res) => {
  try {
    // Find all users referred by "admin" directly (Level A)
    const levelAMembers = await User.find({ referredBy: "admin" }).select('_id email balance referredBy referralCode');

    let allMembers = [];

    // Add Level A members
    levelAMembers.forEach(member => {
      allMembers.push({
        _id: member._id,
        email: member.email,
        balance: member.balance,
        referredBy: member.referredBy,
        referralCode: member.referralCode,
        level: 1
      });
    });

    // Find Level B members (referred by Level A members)
    for (const levelAMember of levelAMembers) {
      const levelBMembers = await User.find({ referredBy: levelAMember.referralCode }).select('_id email balance referredBy referralCode');
      levelBMembers.forEach(member => {
        allMembers.push({
          _id: member._id,
          email: member.email,
          balance: member.balance,
          referredBy: member.referredBy,
          referralCode: member.referralCode,
          level: 2
        });
      });

      // Find Level C members (referred by Level B members)
      for (const levelBMember of levelBMembers) {
        const levelCMembers = await User.find({ referredBy: levelBMember.referralCode }).select('_id email balance referredBy referralCode');
        levelCMembers.forEach(member => {
          allMembers.push({
            _id: member._id,
            email: member.email,
            balance: member.balance,
            referredBy: member.referredBy,
            referralCode: member.referralCode,
            level: 3
          });
        });

        // Find Level D members (referred by Level C members)
        for (const levelCMember of levelCMembers) {
          const levelDMembers = await User.find({ referredBy: levelCMember.referralCode }).select('_id email balance referredBy referralCode');
          levelDMembers.forEach(member => {
            allMembers.push({
              _id: member._id,
              email: member.email,
              balance: member.balance,
              referredBy: member.referredBy,
              referralCode: member.referralCode,
              level: 4
            });
          });
        }
      }
    }

    // Remove duplicates if any
    const uniqueMembers = allMembers.filter((member, index, self) =>
      index === self.findIndex(m => m._id.toString() === member._id.toString())
    );

    // Sort by level then by email
    uniqueMembers.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.email.localeCompare(b.email);
    });

    res.status(200).json({
      rootReferralCode: "admin",
      totalMembers: uniqueMembers.length,
      teamMembers: uniqueMembers,
    });
  } catch (err) {
    console.error("Admin team fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllWithdrawalAccounts = async (req, res) => {
  try {
    const accounts = await WithdrawalAccount.find();
    console.log("Withdrawal accounts:", accounts);
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching withdrawal accounts" });
  }
};

const checkWithdrawalAccountExists = async () => {

  const accounts = await WithdrawalAccount.countDocuments();
  if (accounts > 0) {
    return true;
  } else {
    const newAccount = new WithdrawalAccount({
      accountID: "Testing Account",
      qrImg:
        "https://static.vecteezy.com/system/resources/previews/002/557/391/original/qr-code-for-scanning-free-vector.jpg",
    });
    await newAccount.save();
    return false;
  }
};

const updateWithdrawalAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountID, qrImg } = req.body;

    const account = await WithdrawalAccount.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Withdrawal account not found" });
    }

    if (accountID) account.accountID = accountID;
    if (qrImg) account.qrImg = qrImg;

    await account.save();
    res.status(200).json({ message: "Account updated", account });
  } catch (error) {
    console.error("Error updating withdrawal account:", error);
    res.status(500).json({ message: "Error updating withdrawal account" });
  }
};

// Admin adds deposit to user
const adminAddDeposit = async (req, res) => {
  try {
    // Validate input

    console.log("Admin add deposit request body:", req.body);

    const { userId, amount, remark } = AdminDepositSchema.parse(req.body);

    console.log("Parsed admin deposit data:", { userId, amount, remark });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Create deposit record
    const deposit = await Deposit.create({
      user: userId,
      amount,
      transactionId: `admin-${userId}-${Date.now()}`,
      status: "approved",
      remark: remark || "",
      addedByAdmin: true,
    });
    // Update user balance
    user.balance += amount;
    user.depositBalance += amount;
    await user.save();
    // Optionally, create a notification
    await createNotification(
      userId,
      "Admin Deposit",
      `Admin added $${amount.toFixed(2)} to your account.` +
      (remark ? ` Remark: ${remark}` : ""),
      "deposit",
      { transactionId: deposit._id, amount }
    );
    res.status(201).json({ message: "Deposit added by admin", deposit });
  } catch (error) {
    console.error("Admin add deposit error:", error);
    res.status(400).json({ message: error.message || "Failed to add deposit" });
  }
};

const blockUser = async (req, res) => {
  const { userId, reason } = req.body;

  console.log("I am here", userId, reason);
  if (!userId) {
    return res.status(400).json({ message: "userId or email is required" });
  }
  try {
    let user = null;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ email: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isBlocked = true;
    if (reason) {
      user.blockReason = reason;
    }
    user.editedByAdmin = new Date();
    await user.save();
    res
      .status(200)
      .json({ message: "User blocked successfully", userId: user._id, reason });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to block user", error: error.message });
  }
};

const unblockUser = async (req, res) => {
  const { userId, reason } = req.body;

  console.log("I am here", userId, reason);
  if (!userId) {
    return res.status(400).json({ message: "userId or email is required" });
  }
  try {
    let user = null;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ email: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isBlocked = false;
    if (reason) {
      user.blockReason = reason;
    }
    user.editedByAdmin = new Date();
    await user.save();
    res
      .status(200)
      .json({ message: "User unblocked successfully", userId: user._id, reason });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to unblock user", error: error.message });
  }
};

const blockWithdraw = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId or email is required" });
  }
  try {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ email: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.canWithdraw = false;
    if (reason) {
      user.withdrawBlockReason = reason;
    }
    user.editedByAdmin = new Date();
    await user.save();
    res.status(200).json({
      message: "User withdrawal blocked successfully",
      userId: user._id,
      reason,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to block withdrawal", error: error.message });
  }
};

const UnlockWithdraw = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId or email is required" });
  }
  try {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ email: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.canWithdraw = true;
    if (reason) {
      user.withdrawBlockReason = reason;
    }
    user.editedByAdmin = new Date();
    await user.save();
    res.status(200).json({
      message: "User withdrawal unblocked successfully",
      userId: user._id,
      reason,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to unblock withdrawal", error: error.message });
  }
};

const getUserDetails = async (req, res) => {

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id, { password: 0 });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all transactions for the user
      const deposits = await Deposit.find({ user: user._id });
      const withdrawals = await Withdrawal.find({ user: user._id });

      // Get all questions submitted by the user
      const submissions = await QuizSubmission.find({ user: user._id });

      res.status(200).json({
        user,
        deposits,
        withdrawals,
        submissions,
      });

    }
    else {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

  }
  catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }

}

const UpdateUserDetails = async (req, res) => {
  try {
    const { email, phone, newPassword, username } = req.body;

    console.log("Update user details request body:", req.body);
    const userId = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if we're updating email
    if (email && email != user.email) {
      // Check if email already exists for another user
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Check if we're updating phone
    if (phone && phone !== user.phone) {
      // Check if phone already exists for another user
      const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phone = phone;
    }

    // Check if we're updating username
    if (username && username !== user.username) {
      user.username = username;
    }

    if (newPassword) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();

    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendNotification = async (req, res) => {

  const { title, message } = req.body;

  const userId = req.params.userId;

  if (!userId || !title || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await createNotification(userId, title, message, "system");

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

const sendBulkNotification = async (req, res) => {

  const { userIds, title, message } = req.body;

  console.log("Bulk notification request body:", req.body);

  if (!userIds || !title || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {

    let NotificationArray = [];

    await Promise.all(userIds.map((userId) => {
      NotificationArray.push(
        {
          user : userId,
          title,
          message,
          type: "system"
        }
      );
    }))

    await Notification.insertMany(NotificationArray);

    res.status(200).json({ message: "Bulk notifications sent successfully" });

  }
  catch (error) {
    console.error("Error sending bulk notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

export {
  getAllUsers,
  getAllContactFormData,
  getAllDeposits,
  updateDepositStatus,
  getAllWithdrawals,
  updateWithdrawalStatus,
  getAllTeamMembers,
  getAllWithdrawalAccounts,
  updateWithdrawalAccount,
  checkWithdrawalAccountExists,
  adminAddDeposit,
  blockUser,
  unblockUser,
  blockWithdraw,
  UnlockWithdraw,
  getUserDetails,
  UpdateUserDetails,
  sendNotification,
  sendBulkNotification
};
