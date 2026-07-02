// One-off script: fetches estimated calories per dish from a free nutrition API
// and rewrites src/data.js with the results. Requires CALORIE_NINJAS_API_KEY.
// Usage: npm run fetch-calories

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dishes, deliveryInfo } from "../src/data.js";

const API_BASE_URL = process.env.CALORIE_API_BASE_URL || "https://api.calorieninjas.com";
const API_KEY = process.env.CALORIE_NINJAS_API_KEY;

if (!API_KEY) {
  console.error("Missing CALORIE_NINJAS_API_KEY. Copy .env.example to .env and set your key, then run:");
  console.error("  node --env-file=.env scripts/fetch-calories.mjs");
  process.exit(1);
}

async function fetchCalories(query) {
  const url = `${API_BASE_URL}/v1/nutrition?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "X-Api-Key": API_KEY } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.items?.length) return null;
  const total = data.items.reduce((sum, item) => sum + (item.calories ?? 0), 0);
  return Math.round(total) || null;
}

async function getCaloriesForDish(dish) {
  let calories = await fetchCalories(dish.name);
  let estimated = false;
  if (calories == null) {
    calories = await fetchCalories(dish.description);
  }
  if (calories == null) {
    calories = dish.calories ?? 0;
    estimated = true;
  }
  return { calories, estimated };
}

const updated = [];
for (const dish of dishes) {
  const { calories, estimated } = await getCaloriesForDish(dish);
  if (estimated) {
    console.warn(`No CalorieNinjas match for "${dish.name}" - keeping existing estimate (${calories} kcal)`);
  }
  updated.push({ ...dish, calories, estimated });
}

function serializeDish(dish) {
  const { estimated, ...rest } = dish;
  const fields = Object.entries(rest)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ");
  const comment = estimated ? " // estimated manually - CalorieNinjas returned no match" : "";
  return `  { ${fields} },${comment}`;
}

const fileContent = `export const deliveryInfo = ${JSON.stringify(deliveryInfo, null, 2)};

export const dishes = [
${updated.map(serializeDish).join("\n")}
];
`;

const dataFilePath = fileURLToPath(new URL("../src/data.js", import.meta.url));
writeFileSync(dataFilePath, fileContent, "utf-8");
console.log(`Wrote calories for ${updated.length} dishes to src/data.js`);
