import "dotenv/config";
import { detectIntent } from "./agents/intentAgent.js";

const query = "I am getting pimples and my budget is 600 rupees.";

try {
  const response = await detectIntent(query);
  console.log(response);
} catch (error) {
  console.error("Gemini Error:", error.message);
}