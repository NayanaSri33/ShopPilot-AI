import axios from "axios";
import "dotenv/config";

const SERP_API_KEY = process.env.SERP_API_KEY;

export async function searchMarketplace(intent) {
  const query = [
    intent.brand,
    intent.concern,
    intent.category,
    intent.color,
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q: query,
        gl: "in",
        hl: "en",
        api_key: SERP_API_KEY,
      },
    });

    const results = response.data.shopping_results || [];

    let products = results.map((item, index) => ({
      id: index + 1,
      name: item.title,
      price: Number(item.price?.replace(/[₹,]/g, "")) || 0,
      rating: item.rating || 4,
      image: item.thumbnail,
      store: item.source,
      link: item.link,
      brand: item.brand || "",
    }));

    // Budget filter
    if (intent.budget) {
      products = products.filter(
        (p) => p.price > 0 && p.price <= Number(intent.budget)
      );
    }

    return products.slice(0, 10);
  } catch (error) {
    console.error("Marketplace Agent Error:", error.message);
    return [];
  }
}