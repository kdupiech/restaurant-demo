# 🍕 Restaurant Demo

A Deliveroo-style restaurant ordering app built with React + Vite.

## Features

- Browse menu items and add to cart
- Multi-step payment flow
- Deliveroo brand identity

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React 18
- Vite
- GitHub Actions (Claude PR review)

## Calories data

Dish calorie estimates are fetched offline from the [CalorieNinjas](https://calorieninjas.com/api) API and written into `src/data.js` — the app never calls this API at runtime.

To refresh the estimates:

1. Sign up for a free API key at calorieninjas.com (or api-ninjas.com, if CalorieNinjas has migrated).
2. Copy `.env.example` to `.env` and set `CALORIE_NINJAS_API_KEY`.
3. Run `npm run fetch-calories`.

Dishes where the API finds no match keep their existing value and get a comment in `src/data.js` marking them as manually estimated.
