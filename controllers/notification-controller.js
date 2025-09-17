import Notification from '../models/notification-model.js';
import User from '../models/user-model.js';
import Question from '../models/ques-modal.js';
import QuizSubmission from '../models/ques-submission-modal.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.status(200).json({
      notifications,
      unreadCount,
      message: "Notifications fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    // If specific notification IDs are provided, update only those
    if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, user: userId },
        { $set: { isRead: true } }
      );
    } else {
      // Otherwise, mark all as read
      await Notification.updateMany(
        { user: userId },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a notification with optional transaction data
export const createNotification = async (userId, title, message, type = 'system', transactionData = {}) => {
  try {
    const notificationData = {
      user: userId,
      title,
      message,
      type
    };
    
    // Add transaction data if provided
    if (transactionData.transactionId) {
      notificationData.transactionId = transactionData.transactionId;
    }
    
    if (transactionData.amount) {
      notificationData.amount = transactionData.amount;
    }
    
    const notification = await Notification.create(notificationData);
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Check for quiz availability and notify user
export const checkAndNotifyQuizAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has sufficient balance
    const user = await User.findById(userId);
    if (!user || user.balance < 30) {
      return res.status(200).json({ 
        available: false, 
        reason: "insufficient_balance" 
      });
    }
    
    // Check if questions exist for today
    const questions = await Question.find();
    if (!questions || questions.length === 0) {
      return res.status(200).json({ 
        available: false, 
        reason: "no_questions" 
      });
    }
    
    // Check if user already submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingSubmission = await QuizSubmission.findOne({
      user: userId,
      submittedAt: { $gte: today }
    });
    
    if (existingSubmission) {
      return res.status(200).json({ 
        available: false,
        reason: "already_completed",
        results: {
          score: existingSubmission.score,
          total: existingSubmission.answers.length
        }
      });
    }
    
    // Quiz is available
    return res.status(200).json({ 
      available: true,
      questionsCount: questions.length
    });
  } catch (error) {
    console.error("Error checking quiz availability:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a referral notification
export const createReferralNotification = async (referrerId, newUserEmail) => {
  try {
    if (!referrerId) return null;
    
    const title = "New Referral Joined";
    const message = `${newUserEmail} has joined using your referral link!`;
    
    return await createNotification(referrerId, title, message, 'referral');
  } catch (error) {
    console.error("Error creating referral notification:", error);
    return null;
  }
};
