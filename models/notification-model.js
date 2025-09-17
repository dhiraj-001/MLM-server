import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['referral', 'quiz', 'system', 'reward', 'deposit', 'withdrawal'],
    default: 'system'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deposit' || 'Withdrawal',
    required: false
  },
  amount: {
    type: Number,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Expire after 30 days
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
