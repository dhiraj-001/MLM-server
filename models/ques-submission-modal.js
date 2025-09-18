import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedAnswer: Number,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true
    },
    reward: {
        type: Number,
        default: 0
    },
    accuracyPercentage: {
        type: Number,
        default: 0
    },
    balanceType: {
        type: String,
        enum: ['deposit', 'earning'],
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one submission per user per day
submissionSchema.index({ user: 1, submittedAt: 1 }, { unique: true });

const QuizSubmission = mongoose.model('QuizSubmission', submissionSchema);
export default QuizSubmission;