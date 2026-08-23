import { detectIntent } from "../agents/intentAgent.js";
import { retrievalAgent } from "../agents/retrievalAgent.js";
import { recommendationAgent } from "../agents/recommendationAgent.js";

export async function shoppingOrchestrator(userMessage) {
  const intent = await detectIntent(userMessage);

  const retrieval = await retrievalAgent(intent);

  const recommendation = await recommendationAgent(
    intent,
    retrieval.products
  );

  return {
    intent,
    marketplaces: retrieval.stores,
    retrievedProducts: retrieval.products,
    recommendation,
  };
}