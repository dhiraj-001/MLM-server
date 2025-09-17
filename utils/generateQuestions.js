import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateQuestions() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Generate 5 multiple choice questions about easy general knowledge. 
        Format: JSON array with objects containing:
        - question (string)
        - options (array of 4 strings)
        - correctAnswer (number 0-3 indicating correct option index)
        Instuctions:
        - The questions should be easy and suitable for a general audience.
        - The options should be unique and plausible.
        - The correct answer should be one of the options.
        - Give only the JSON array without any additional text or additional commas or ticks.
        Example:
        [
            {
                "question": "What is the capital of France?",
                "options": ["Berlin", "Madrid", "Paris", "Rome"],
                "correctAnswer": 2
            },
            ...
        ] 
        `;

        const result = await model.generateContent(prompt);

        const questions = result.response.text();

        const cleanJson = questions
            .replace(/^```json\s*/, '')  // Remove ```json from start
            .replace(/```$/, '')         // Remove ``` from end
            .trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating questions:', error);
        throw error;
    }
}

// generateQuestions()

export default generateQuestions;
