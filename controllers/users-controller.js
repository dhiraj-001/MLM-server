import Withdrawal from "../models/withdrawal-model.js";
import Deposit from "../models/deposit-model.js";
import User from "../models/user-model.js";
import WithdrawalAccount from "../models/withdrawalAccount-model.js";
import bcrypt from "bcryptjs";

const getUserProfile = async (req, res) => {
  try {
    const userData = req.user;
    console.log("userData", userData);
    res.status(200).json({
      user: userData,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, proofImage, transactionId } = req.body;
    const userId = req.user._id;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // proofImage or transactionId is required
    if (!proofImage && !transactionId) {
      return res.status(400).json({
        message: "Either Image or ID is required",
      });
    }

    // Parse amount to ensure it's a number
    const withdrawalAmount = parseFloat(amount);

    // Check if amount is valid
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Please enter a valid positive amount" });
    }

    // Check minimum withdrawal amount
    if (withdrawalAmount < 50) {
      return res
        .status(400)
        .json({ message: "Minimum withdrawal amount is $50" });
    }

    // Check if user has sufficient balance
    if (withdrawalAmount > req.user.balance) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for this withdrawal" });
    }

    // Check if user is blocked
    if (req.user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account is blocked. Please contact support." });
    }
    // Check if user can withdraw
    if (!req.user.canWithdraw) {
      return res
        .status(403)
        .json({
          message:
            "Withdrawals are blocked for your account. Please contact support.",
        });
    }

    const withdrawal = await Withdrawal.create({
      user: userId,
      amount: withdrawalAmount,
      proofImage: proofImage || undefined,
      transactionId: transactionId || undefined,
      accountDetails: {
        accountNumber: "Default",
        bankName: "Default",
        ifscCode: "Default",
      },
    });

    res.status(201).json({
      message: "Withdrawal request created successfully",
      withdrawal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const withdrawals = await Withdrawal.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      withdrawals,
      message: "Withdrawal history fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createDeposit = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;
    const userId = req.user._id;

    const existingDeposit = await Deposit.findOne({ transactionId });
    if (existingDeposit) {
      return res.status(400).json({ message: "Transaction ID already exists" });
    }

    const deposit = await Deposit.create({
      user: userId,
      amount,
      transactionId,
    });

    res.status(201).json({
      message: "Deposit request created successfully",
      deposit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDepositHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const deposits = await Deposit.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      deposits,
      message: "Deposit history fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDailyReward = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const balance = user.balance || 0;

    const tiers = [
      { min: 30, max: 499.99, rate: 0.02 },
      { min: 500, max: 1999.99, rate: 0.025 },
      { min: 2000, max: 4999.99, rate: 0.03 },
      { min: 5000, max: 9999.99, rate: 0.035 },
      { min: 10000, max: 29999.99, rate: 0.04 },
      { min: 30000, max: 49999.99, rate: 0.0425 },
      { min: 50000, max: 74999.99, rate: 0.045 },
      { min: 75000, max: 100000, rate: 0.05 },
    ];

    let applicableRate = 0;

    for (const tier of tiers) {
      if (balance >= tier.min && balance <= tier.max) {
        applicableRate = tier.rate;
        break;
      }
    }

    return res.status(200).json({
      userId: user._id,
      email: user.email,
      balance,
      percentagePerDay: applicableRate * 100,
      dailyEarning: balance * applicableRate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMonthlyReward = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referralCode = user.referralCode;

    // Level 1: Direct referrals
    const directReferrals = await User.find(
      { referredBy: referralCode },
      "referralCode _id"
    );
    const directReferralsCount = directReferrals.length;

    // Use $graphLookup to get down 3 more levels (total 4)
    const result = await User.aggregate([
      {
        $match: { referralCode: referralCode },
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$referralCode",
          connectFromField: "referralCode",
          connectToField: "referredBy",
          as: "teamMembers",
          maxDepth: 3, // levels: 0 (B), 1 (C), 2 (D)
          depthField: "level",
        },
      },
      {
        $project: {
          _id: 0,
          teamMembers: 1,
        },
      },
    ]);

    const totalTeamMembers = result[0]?.teamMembers?.length || 0;

    const starRanks = [
      { star: "6-Star", direct: 150, team: 2000, reward: 3000 },
      { star: "5-Star", direct: 100, team: 1200, reward: 2000 },
      { star: "4-Star", direct: 75, team: 700, reward: 1200 },
      { star: "3-Star", direct: 50, team: 400, reward: 800 },
      { star: "2-Star", direct: 30, team: 200, reward: 500 },
      { star: "1-Star", direct: 15, team: 80, reward: 250 },
    ];

    let reward = 0;
    let currentRank = null;

    for (const rank of starRanks) {
      if (
        directReferralsCount >= rank.direct &&
        totalTeamMembers >= rank.team
      ) {
        reward = rank.reward;
        currentRank = rank.star;
        break;
      }
    }

    res.status(200).json({
      directReferrals: directReferralsCount,
      totalTeamMembers,
      currentRank,
      monthlyBonus: reward,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getReferralCommission = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const referralCode = user.referralCode;

    // Level A: Direct referrals
    const levelA = await User.find(
      { referredBy: referralCode },
      "_id balance referralCode"
    );

    // Use $graphLookup to get Levels B, C, D (3 depths max)
    const result = await User.aggregate([
      { $match: { referralCode: referralCode } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$referralCode",
          connectFromField: "referralCode",
          connectToField: "referredBy",
          as: "teamMembers",
          maxDepth: 3,
          depthField: "level",
        },
      },
      {
        $project: {
          teamMembers: {
            $map: {
              input: "$teamMembers",
              as: "member",
              in: {
                _id: "$$member._id",
                balance: "$$member.balance",
                level: "$$member.level",
              },
            },
          },
        },
      },
    ]);

    const teamMembers = result[0]?.teamMembers || [];

    // Split by levels
    const levelB = teamMembers.filter((m) => m.level === 0);
    const levelC = teamMembers.filter((m) => m.level === 1);
    const levelD = teamMembers.filter((m) => m.level === 2);

    const levelACount = levelA.length;
    const teamCount = levelB.length + levelC.length + levelD.length;

    // Define the stage-based commission structure
    const commissionStages = [
      { direct: 50, team: 500, A: 0.21, B: 0.11, C: 0.1, D: 0.06 },
      { direct: 45, team: 350, A: 0.2, B: 0.1, C: 0.09, D: 0.05 },
      { direct: 35, team: 250, A: 0.18, B: 0.09, C: 0.08, D: 0.04 },
      { direct: 25, team: 100, A: 0.16, B: 0.08, C: 0.07, D: 0.03 },
      { direct: 15, team: 50, A: 0.15, B: 0.07, C: 0.05, D: 0.02 },
      { direct: 6, team: 30, A: 0.13, B: 0.06, C: 0.02, D: 0.01 },
      { direct: 3, team: 10, A: 0.12, B: 0.05, C: 0.02, D: 0.01 },
      { direct: 0, team: 0, A: 0, B: 0, C: 0, D: 0 },
    ];

    // Find user's current stage
    const stage =
      commissionStages.find(
        (s) => levelACount >= s.direct && teamCount >= s.team
      ) || commissionStages[commissionStages.length - 1];

    // Commission calculations
    const commissionFromA = levelA.reduce(
      (sum, u) => sum + u.balance * stage.A,
      0
    );
    const commissionFromB = levelB.reduce(
      (sum, u) => sum + u.balance * stage.B,
      0
    );
    const commissionFromC = levelC.reduce(
      (sum, u) => sum + u.balance * stage.C,
      0
    );
    const commissionFromD = levelD.reduce(
      (sum, u) => sum + u.balance * stage.D,
      0
    );

    const totalCommission =
      commissionFromA + commissionFromB + commissionFromC + commissionFromD;

    // Total balances from each level
    const levelATotalBalance = levelA.reduce((sum, u) => sum + u.balance, 0);
    const levelBTotalBalance = levelB.reduce((sum, u) => sum + u.balance, 0);
    const levelCTotalBalance = levelC.reduce((sum, u) => sum + u.balance, 0);
    const levelDTotalBalance = levelD.reduce((sum, u) => sum + u.balance, 0);

    // Final JSON Response
    res.status(200).json({
      userId: user._id,
      email: user.email,
      referralCode: user.referralCode,
      currentRank: `Stage ${commissionStages.indexOf(stage) + 1}-Star`,
      directReferrals: levelACount,
      totalTeamMembers: teamCount,
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      commissionBreakdown: {
        fromDirectReferrals: parseFloat(commissionFromA.toFixed(2)),
        fromLevelB: parseFloat(commissionFromB.toFixed(2)),
        fromLevelC: parseFloat(commissionFromC.toFixed(2)),
        fromLevelD: parseFloat(commissionFromD.toFixed(2)),
      },
      commissionPercentages: {
        A: stage.A,
        B: stage.B,
        C: stage.C,
        D: stage.D,
      },
      balanceSummary: {
        levelA_TotalBalance: levelATotalBalance,
        levelB_TotalBalance: levelBTotalBalance,
        levelC_TotalBalance: levelCTotalBalance,
        levelD_TotalBalance: levelDTotalBalance,
      },
    });
  } catch (error) {
    console.error("Referral Commission Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const referralCode = user.referralCode;

    const result = await User.aggregate([
      { $match: { referralCode } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$referralCode",
          connectFromField: "referralCode",
          connectToField: "referredBy",
          as: "teamMembers",
          maxDepth: 3,
          depthField: "level",
        },
      },
      {
        $project: {
          teamMembers: {
            $map: {
              input: "$teamMembers",
              as: "member",
              in: {
                _id: "$$member._id",
                email: "$$member.email",
                balance: "$$member.balance",
                referredBy: "$$member.referredBy",
                level: { $add: ["$$member.level", 1] },
              },
            },
          },
        },
      },
    ]);

    const teamMembers = result[0]?.teamMembers || [];

    res.status(200).json({
      userId: user._id,
      email: user.email,
      totalTeamMembers: teamMembers.length,
      teamMembers: teamMembers.sort((a, b) => a.level - b.level),
    });
  } catch (error) {
    console.error("Get Team Members Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { email, phone, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if we're updating email
    if (email && email !== user.email) {
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

    // Check if we're updating password
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        String(currentPassword),
        user.password
      );

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
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

const getAllWithdrawalAccounts = async (req, res) => {
  try {
    const accounts = await WithdrawalAccount.find();
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching withdrawal accounts" });
  }
};

export {
  getUserProfile,
  createWithdrawalRequest,
  getWithdrawalHistory,
  createDeposit,
  getDepositHistory,
  getDailyReward,
  getMonthlyReward,
  getReferralCommission,
  getTeamMembers,
  updateUserProfile,
  getAllWithdrawalAccounts,
};
