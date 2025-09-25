import cron from "node-cron";
import Question from "../models/ques-modal.js";
import { questions100 } from "./questions100.js";

const updateDailyQuestions = async () => {
  try {
    // Delete old questions
    await Question.deleteMany({});

    // Pick 5 random questions from 100
    const shuffled = [...questions100].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    console.log("Selected Questions:", selectedQuestions);

    // Insert into DB
    await Question.insertMany(selectedQuestions);

    console.log("Daily 5 random questions updated successfully");
  } catch (error) {
    console.error("Error updating daily questions:", error);
  }
};

// Run at midnight every day
export const startQuizCron = async () => {
  await updateDailyQuestions(); // Run immediately at startup

  cron.schedule("0 0 * * *", async () => {
    await updateDailyQuestions(); // Then every midnight
  });

  console.log("Quiz cron job started");
};
