import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function detectIntent(message) {
  try {
    const prompt = `
You are ShopPilot AI's Intent Detection Agent.

Extract shopping intent from the user's query.

Return ONLY valid JSON.

Example:
{
  "category":"Sneakers",
  "concern":"",
  "budget":2000,
  "brand":"Nike",
  "purpose":"College",
  "color":"White"
}

User Query:
"${message}"
`;

    const result = await model.generateContent(prompt);

    const cleaned = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);

  } catch (error) {
    console.log("Intent Agent Fallback");

    const msg = message.toLowerCase();

    const intent = {
      category: "",
      concern: "",
      budget: Number(msg.match(/\d+/)?.[0]) || 2000,
      brand: "",
      purpose: "",
      color: "",
    };

    // -------- Category Detection --------
    if (
      msg.includes("shoe") ||
      msg.includes("sneaker") ||
      msg.includes("nike") ||
      msg.includes("adidas") ||
      msg.includes("puma") ||
      msg.includes("campus")
    ) {
      intent.category = "Sneakers";
    }

    else if (
      msg.includes("hoodie") ||
      msg.includes("dress") ||
      msg.includes("shirt") ||
      msg.includes("jeans") ||
      msg.includes("tshirt")
    ) {
      intent.category = "Fashion";
    }

    else if (
      msg.includes("lipstick") ||
      msg.includes("foundation") ||
      msg.includes("makeup") ||
      msg.includes("mascara")
    ) {
      intent.category = "Makeup";
    }

    else if (
      msg.includes("pimple") ||
      msg.includes("acne") ||
      msg.includes("serum") ||
      msg.includes("face wash") ||
      msg.includes("moisturizer")
    ) {
      intent.category = "Skincare";
      intent.concern = "Pimples";
    }

    // -------- Color Detection --------
    const colors = [
      "white",
      "black",
      "blue",
      "red",
      "pink",
      "green",
      "grey",
      "gray",
      "yellow",
      "brown",
    ];

    colors.forEach((color) => {
      if (msg.includes(color)) {
        intent.color = color;
      }
    });

    // -------- Brand Detection --------
    const brands = [
      "nike",
      "adidas",
      "puma",
      "campus",
      "minimalist",
      "plum",
      "dot & key",
      "lakme",
      "maybelline",
    ];

    brands.forEach((brand) => {
      if (msg.includes(brand)) {
        intent.brand = brand;
      }
    });

    return intent;
  }
}