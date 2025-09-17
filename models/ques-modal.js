import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number, // Index of correct option
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Document expires after 24 hours
    }
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
