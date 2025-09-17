import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized User, Token Not Found" });
    }

    const jwtToken = token.replace("Bearer", "").trim();

    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

    const userData = await User.findOne({ email: decoded.email }).select({
      password: 0,
    });

    if (!userData) {
      return res
        .status(404)
        .json({ message: `User with email ${decoded.email} not found` });
    }

    if(userData.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
        user: {
          id: userData._id,
          isBlocked: userData.isBlocked,
        },
      });
    }

    req.user = userData;
    req.token = jwtToken;
    req.userID = userData._id;

    next();
  } catch (error) {
    const status = 400;
    const message = error.errors;

    console.log(`Error in authMiddleware: ${error.message}`);

    const err = {
      status,
      message,
    };
    next(err);
  }
};

export default authMiddleware;
