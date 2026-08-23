import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ✅ Export the correct function name
export async function rankProducts(retrievedProducts, intent) {
  try {
    const prompt = `
You are ShopPilot AI Recommendation Agent.

Your job is to rank products retrieved from marketplaces.

User Intent:
${JSON.stringify(intent)}

Retrieved Products:
${JSON.stringify(retrievedProducts)}

Rules:
- Recommend ONLY products from Retrieved Products.
- Respect user's concern and budget.
- Explain why each recommendation suits the user.
- Return maximum 10 products.
- Return ONLY JSON.

Format:
{
  "reply":"...",
  "rankedProducts":[
    {
      "id":1,
      "reason":"..."
    }
  ]
}
`;

    const result = await model.generateContent(prompt);

    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);

  } catch (error) {
    console.log("Recommendation Agent Fallback");

    // Gemini quota fallback
    return {
      reply: `✨ I found ${retrievedProducts.length} products matching your search.`,

      rankedProducts: retrievedProducts.slice(0, 10).map((product) => ({
        id: product.id,
        reason: `Good match for ${intent.category || "your search"} under ₹${intent.budget}.`,
      })),
    };
  }
}