import { searchMarketplace } from "../services/marketplaceService.js";

export async function retrievalAgent(intent) {
  const products = await searchMarketplace(intent);

  return {
    count: products.length,
    stores: [...new Set(products.map((p) => p.store))],
    products,
  };
}