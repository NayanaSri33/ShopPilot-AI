import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

import { detectIntent } from "../agents/intentAgent.js";
import { rankProducts } from "../agents/recommendationAgent.js";
import { searchMarketplace } from "../services/marketplaceService.js";

dotenv.config({ override: true });

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Message is required",
    });
  }

  try {
    // =========================
    // STEP 1 — Intent Agent
    // =========================
    const intent = await detectIntent(message);

    // =========================
    // STEP 2 — Retrieval Agent
    // =========================
    const marketplaceProducts = await searchMarketplace(intent);

    // =========================
    // STEP 3 — Recommendation Agent
    // =========================
    const recommendation = await rankProducts(
      marketplaceProducts,
      intent
    );

    return res.json({
      success: true,
      intent,
      recommendation,
      retrievedProducts: marketplaceProducts,
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    // ============================================
    // Gemini quota exhausted → use local intent
    // ============================================
    if (error.status === 429) {
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
        msg.includes("puma")
      ) {
        intent.category = "Sneakers";
      } else if (
        msg.includes("pimple") ||
        msg.includes("acne") ||
        msg.includes("serum") ||
        msg.includes("face wash") ||
        msg.includes("moisturizer")
      ) {
        intent.category = "Skincare";
        intent.concern = "Pimples";
      } else if (
        msg.includes("lipstick") ||
        msg.includes("foundation") ||
        msg.includes("makeup")
      ) {
        intent.category = "Makeup";
      } else if (
        msg.includes("hoodie") ||
        msg.includes("dress") ||
        msg.includes("shirt") ||
        msg.includes("jeans")
      ) {
        intent.category = "Fashion";
      }

      // -------- Color Detection --------
      const colors = [
        "white",
        "black",
        "blue",
        "red",
        "pink",
        "green",
        "brown",
        "grey",
        "gray",
        "yellow",
      ];

      colors.forEach((color) => {
        if (msg.includes(color)) {
          intent.color = color;
        }
      });

      // =========================
      // Retrieval Agent
      // =========================
      const marketplaceProducts = await searchMarketplace(intent);

      // =========================
      // Recommendation Agent
      // =========================
      const recommendation = await rankProducts(
        marketplaceProducts,
        intent
      );

      return res.json({
        success: true,
        intent,
        recommendation,
        retrievedProducts: marketplaceProducts,
      });
    }

    // =========================
    // Any Other Error
    // =========================
    return res.status(500).json({
      success: false,
      message: "ShopPilot AI failed to process the request.",
    });
  }
});

export default router;