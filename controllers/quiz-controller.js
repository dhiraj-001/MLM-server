import Question from '../models/ques-modal.js';
import QuizSubmission from '../models/ques-submission-modal.js';
import User from '../models/user-model.js';
import { createNotification } from './notification-controller.js';

export const getQuestions = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Check user balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Enforce minimum balance requirement
        if (user.balance < 30) {
            return res.status(403).json({ 
                message: "Insufficient balance. Minimum $30 required to take the quiz",
                insufficientBalance: true 
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
                completed: true,
                results: {
                    score: existingSubmission.score,
                    total: existingSubmission.answers.length
                }
            });
        }
        
        const questions = await Question.find({}, { correctAnswer: 0 });
        res.json({ questions });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Error fetching questions" });
    }
};

export const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;
        const userId = req.user._id;
        
        // Check user balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Enforce minimum balance requirement
        if (user.balance < 30) {
            return res.status(403).json({ 
                message: "Insufficient balance. Minimum $30 required to take the quiz" 
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
            return res.status(400).json({ message: "Already submitted today's quiz" });
        }

        // Calculate score
        const questions = await Question.find();
        let score = 0;
        const checkedAnswers = answers.map((ans, idx) => {
            const isCorrect = questions[idx].correctAnswer === ans;
            if (isCorrect) score++;
            return {
                question: questions[idx]._id,
                selectedAnswer: ans,
                isCorrect
            };
        });
        
        // Calculate reward: 2% of user's current balance
        const rewardPercentage = 0.02; // 2%
        const reward = user.balance * rewardPercentage;
        const accuracyPercentage = (score / questions.length) * 100;
        
        // Update user balance
        user.balance += reward;
        await user.save();

        // Save submission with reward information
        const submission = await QuizSubmission.create({
            user: userId,
            answers: checkedAnswers,
            score,
            reward,
            accuracyPercentage
        });

        // Notify user about reward
        await createNotification(
            userId,
            "Quiz Reward Earned",
            `You earned $${reward.toFixed(2)} for completing today's quiz with ${score}/${questions.length} correct answers!`,
            'reward'
        );

        res.json({
            message: "Quiz submitted successfully",
            score,
            total: questions.length,
            reward,
            newBalance: user.balance
        });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({ message: "Error submitting quiz" });
    }
};

// After adding daily questions, notify eligible users about quiz availability
export const notifyEligibleUsersAboutQuiz = async () => {
    try {
        // Find all users with at least $30 balance who haven't completed today's quiz
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eligibleUsers = await User.find({ balance: { $gte: 30 } });
        
        for (const user of eligibleUsers) {
            // Check if user already submitted today
            const existingSubmission = await QuizSubmission.findOne({
                user: user._id,
                submittedAt: { $gte: today }
            });
            
            if (!existingSubmission) {
                await createNotification(
                    user._id,
                    "Daily Quiz Available",
                    "Complete today's quiz to earn rewards based on your account balance!",
                    'quiz'
                );
            }
        }
    } catch (error) {
        console.error("Error notifying users about quiz:", error);
    }
};
