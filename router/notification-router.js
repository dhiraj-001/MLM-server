import express from 'express';
import authMiddleware from '../middlewares/auth-middleware.js';
import { 
  getUserNotifications, 
  markNotificationsAsRead,
  checkAndNotifyQuizAvailability
} from '../controllers/notification-controller.js';

const router = express.Router();

router.get('/', authMiddleware, getUserNotifications);
router.post('/mark-read', authMiddleware, markNotificationsAsRead);
router.get('/quiz-availability', authMiddleware, checkAndNotifyQuizAvailability);

export default router;
