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
                    total: existingSubmission.answers.length,
                    balanceType: existingSubmission.balanceType,
                    reward: existingSubmission.reward
                }
            });
        }
        
        // Check individual balances for eligibility
        const depositEligible = user.depositBalance >= 30;
        const earningEligible = user.earningBalance >= 30;
        
        if (!depositEligible && !earningEligible) {
            return res.status(403).json({
                message: "Insufficient balance. Minimum $30 required in either deposit or earning balance to take the quiz",
                insufficientBalance: true,
                balances: {
                    depositBalance: user.depositBalance,
                    earningBalance: user.earningBalance
                }
            });
        }
        
        const questions = await Question.find({}, { correctAnswer: 0 });
        res.json({ 
            questions,
            balanceOptions: {
                depositEligible,
                earningEligible,
                depositBalance: user.depositBalance,
                earningBalance: user.earningBalance
            }
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Error fetching questions" });
    }
};

export const submitQuiz = async (req, res) => {
    try {
        const { answers, balanceType } = req.body;
        const userId = req.user._id;
        
        // Validate balance type
        if (!balanceType || !['deposit', 'earning'].includes(balanceType)) {
            return res.status(400).json({ 
                message: "Invalid balance type. Must be 'deposit' or 'earning'" 
            });
        }
        
        // Check user balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
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

        // Check minimum balance requirement based on selected balance type
        const selectedBalance = balanceType === 'deposit' ? user.depositBalance : user.earningBalance;
        if (selectedBalance < 30) {
            return res.status(403).json({
                message: `Insufficient ${balanceType} balance. Minimum $30 required to take the quiz`,
                insufficientBalance: true,
                balanceType,
                currentBalance: selectedBalance
            });
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
        
        // Calculate reward: 2% of selected balance
        const rewardPercentage = 0.02; // 2%
        const reward = selectedBalance * rewardPercentage;
        const accuracyPercentage = (score / questions.length) * 100;
        
        // Update user balances. Reward is always added to earning balance.
        user.earningBalance += reward;
        user.balance += reward; // Keep main balance for backward compatibility
        await user.save();

        // Save submission with reward information
        const submission = await QuizSubmission.create({
            user: userId,
            answers: checkedAnswers,
            score,
            reward,
            accuracyPercentage,
            balanceType
        });

        // Notify user about reward
        await createNotification(
            userId,
            "Quiz Reward Earned",
            `You earned $${reward.toFixed(2)} for completing today's quiz with ${score}/${questions.length} correct answers using your ${balanceType} balance!`,
            'reward'
        );

        res.json({
            message: "Quiz submitted successfully",
            score,
            total: questions.length,
            reward,
            balanceType,
            newBalance: user.balance,
            newDepositBalance: user.depositBalance,
            newEarningBalance: user.earningBalance
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
        
        const eligibleUsers = await User.find({ 
          $expr: { $gte: [{ $add: ["$depositBalance", "$earningBalance"] }, 30] }
        });
        
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