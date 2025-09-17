import express from "express";
import {
  home,
  register,
  login,
  user,
  forgetPassword,
  changePassword,
} from "../controllers/auth-controller.js";
import {
  SignUpSchema,
  LoginSchema,
  ForgetPasswordSchema,
} from "../validators/auth-validator.js";
import validate from "../middlewares/validate-middleware.js";
import authMiddleware from "../middlewares/auth-middleware.js";

const router = express.Router();

router.route("/").get(home);

router.route("/register").post(validate(SignUpSchema), register);

router.route("/login").post(validate(LoginSchema), login);

router.route("/user").get(authMiddleware, user);

router
  .route("/forget-password")
  .post(validate(ForgetPasswordSchema), forgetPassword);

router.post("/change-password", authMiddleware, changePassword);

export default router;
