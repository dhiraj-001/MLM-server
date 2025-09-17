import express from "express";
import authMiddleware from "../middlewares/auth-middleware.js";
import {
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
} from "../controllers/users-controller.js";

import { DepositSchema } from "../validators/deposit-validator.js";
import validate from "../middlewares/validate-middleware.js";
import { getQuestions, submitQuiz } from "../controllers/quiz-controller.js";
import notificationRouter from "./notification-router.js";

const router = express.Router();

// Notifications subrouter
router.use('/notifications', notificationRouter);

router.get("/profile", authMiddleware, getUserProfile);
router.patch("/update-profile", authMiddleware, updateUserProfile);
router.post("/withdrawal", authMiddleware, createWithdrawalRequest);
router.get("/withdrawal-history", authMiddleware, getWithdrawalHistory);
router.post("/deposit", authMiddleware, validate(DepositSchema), createDeposit);
router.get("/deposit-history", authMiddleware, getDepositHistory);

router.get("/daily-reward/:userId", getDailyReward);
router.get("/monthly-reward/:userId", getMonthlyReward);
router.get("/referral-commission/:userId", getReferralCommission);
router.get("/team-members/:userId", getTeamMembers);

router.get('/quiz', authMiddleware, getQuestions);
router.post('/quiz', authMiddleware, submitQuiz);

router.get('/withdrawal-accounts', authMiddleware, getAllWithdrawalAccounts);

export default router;
