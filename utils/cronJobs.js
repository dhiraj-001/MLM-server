import cron from 'node-cron';
import Question from '../models/ques-modal.js';
import generateQuestions from './generateQuestions.js';


const updateDailyQuestions = async () => {
    try {
        // Delete old questions
        await Question.deleteMany({});

        const newQuestions = await generateQuestions();
        await Question.insertMany(newQuestions);
        // await console.log(newQuestions);

        console.log('Daily questions updated successfully');
    } catch (error) {
        console.error('Error updating daily questions:', error);
    }
};

// Run at midnight every day
export const startQuizCron = async () => {

    updateDailyQuestions();
    cron.schedule('0 0 * * *', async () => {
        await updateDailyQuestions();
    });
    console.log('Quiz cron job started');
};
