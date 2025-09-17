import express from "express";
import authMiddleware from "../middlewares/auth-middleware.js";
import {
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
  blockWithdraw,
  unblockUser,
  UnlockWithdraw,
  getUserDetails,
  UpdateUserDetails,
  sendNotification,
  sendBulkNotification,
} from "../controllers/admin-controller.js";

const router = express.Router();

// Updated middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log("Admin check - user:", req.user);

  // Enhanced check with more flexibility
  if (
    !req.user ||
    !(
      req.user.isAdmin ||
      req.user.type === "admin" ||
      req.user.role === "admin"
    )
  ) {
    console.log("Admin access denied");
    return res.status(403).json({
      message: "Admin access required",
      user: {
        id: req.user?._id,
        isAdmin: req.user?.isAdmin,
        type: req.user?.type,
        role: req.user?.role,
      },
    });
  }

  console.log("Admin access granted");
  next();
};

router.use(authMiddleware, isAdmin);

router.route("/users").get(getAllUsers);
router.route("/contactFormData").get(getAllContactFormData);
router.route("/deposits").get(getAllDeposits);
router.route("/deposits/:id").patch(updateDepositStatus);
router.route("/withdrawals").get(getAllWithdrawals);
router.route("/withdrawals/:id").patch(updateWithdrawalStatus);
router.route("/team-members/").get(getAllTeamMembers);
router.route("/withdrawal-accounts").get(getAllWithdrawalAccounts);
router.route("/withdrawal-accounts/:id").patch(updateWithdrawalAccount);
router.route("/add-deposit-by-admin").post(adminAddDeposit);
router.route("/block-user").post(blockUser);
router.route("/unblock-user").post(unblockUser);
router.route("/block-withdraw").post(blockWithdraw);
router.route("/unblock-withdraw").post(UnlockWithdraw);
router.route("/user/:id").get(getUserDetails);
router.route("/user/:id").patch(UpdateUserDetails);

router.route("/send-notification/:userId").post(sendNotification);
router.route("/send-notification-bulk").post(sendBulkNotification);


export default router;
