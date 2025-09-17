import User from "../models/user-model.js";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { createReferralNotification } from "./notification-controller.js";

const home = async (req, res, next) => {
  try {
    res.send("Welcome to the home page using controller");
  } catch (error) {
    next(error);
  }
};

const generateRandomPassword = () => {
  const charset = "0123456789";
  let password = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

const register = async (req, res, next) => {
  try {
    const { email, phone, username } = req.body;

    const referredBy = req.body.referredBy?.trim() || "admin";

    console.log(req.body);

    if (!email || !phone || !username) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const referralCode = email.split("@")[0];

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const generatedPassword = generateRandomPassword();
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRound);

    const user = await User.create({
      email,
      phone,
      password: hashedPassword,
      referralCode,
      referredBy,
      username,
    });

    if (referredBy && referredBy !== "admin") {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (referrer) {
        await createReferralNotification(referrer._id, email);
      }
    }

    res.status(201).json({
      message: "User registered successfully",
      createdUser: { ...user._doc, password: undefined },
      password: generatedPassword,
      token: await user.generateToken(),
      userId: user._id.toString(),
      referralCode,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Please provide email or phone along with password.",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account is blocked. Please contact support." });
    }

    const isPasswordValid = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Email/Phone or Password is Incorrect" });
    }

    // Generate token and respond
    const token = await user.generateToken();

    console.log("Token generated:", token);

    res.status(200).json({
      message: "User logged in successfully",
      token,
      userId: user._id.toString(),
      user: {
        ...user._doc,
        password: undefined,
        id: user._id.toString(),
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const user = async (req, res, next) => {
  try {
    const userData = await req.user;
    return res.status(200).json({
      user: userData,
      message: "User data sent successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    const generatedPassword = generateRandomPassword();
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(generatedPassword, saltRound);

    user.password = hashedPassword;
    await user.save();

    const emailSent = await sendPasswordResetEmail(email, generatedPassword);

    if (!emailSent) {
      return res.status(500).json({ message: "Error sending email" });
    }

    res.status(200).json({
      message: "New password has been sent to your email",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;

    console.log("User ID from request:", req.body);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Old password and new password are required. Please provide both to proceed.",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isPasswordValid = await bcrypt.compare(
      String(oldPassword),
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect." });
    }
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRound);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export { home, register, login, user, forgetPassword, changePassword };
