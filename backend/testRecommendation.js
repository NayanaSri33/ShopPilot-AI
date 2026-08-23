import { recommendationAgent } from "./agents/recommendationAgent.js";

const intent = {
  category: "Skincare",
  concern: "Acne or pimples",
  budget: "600",
};

const products = [
  {
    id: 1,
    name: "Minimalist Salicylic Acid Serum",
    category: "Skincare",
    reason: "2% Salicylic Acid for acne and oily skin",
    price: 549,
  },
  {
    id: 2,
    name: "Plum Green Tea Face Wash",
    category: "Skincare",
    reason: "Controls acne and excess oil",
    price: 299,
  },
  {
    id: 3,
    name: "Cetaphil Moisturizer",
    category: "Skincare",
    reason: "Hydrating moisturizer",
    price: 499,
  },
];

const answer = await recommendationAgent(intent, products);

console.log(answer);