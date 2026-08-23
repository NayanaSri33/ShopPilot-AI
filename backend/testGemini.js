import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ override: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

try {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Say hello in one sentence.",
  });

  console.log(response.text);
} catch (error) {
  console.error(error);
}