export const COMBO_RULES = { 2: 0.05, 3: 0.07 };
export const TAX_RATE = 0.20;

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function computeTax(subtotal, rate = TAX_RATE) {
  return round2(subtotal * rate);
}

function sumBy(arr, fn) {
  return arr.reduce((sum, x) => sum + fn(x), 0);
}

function validExplicitShape(categories) {
  const set = new Set(categories);
  if (set.size === 3 && set.has("Starters") && set.has("Mains") && set.has("Desserts")) return 3;
  if (set.size === 2 && set.has("Starters") && set.has("Mains")) return 2;
  if (set.size === 2 && set.has("Mains") && set.has("Desserts")) return 2;
  return null;
}

function makeCombo(comboId, type, shape, lines) {
  const itemsSubtotal = round2(sumBy(lines, (l) => l.price * (l.quantity ?? 1)));
  const discountRate = COMBO_RULES[shape];
  const discountAmount = round2(itemsSubtotal * discountRate);
  const comboTotal = round2(itemsSubtotal - discountAmount);
  const comboCalories = sumBy(lines, (l) => (l.calories ?? 0) * (l.quantity ?? 1));
  return { comboId, type, shape, discountRate, lines, itemsSubtotal, discountAmount, comboTotal, comboCalories };
}

export function groupByCategory(units) {
  return units.reduce(
    (acc, u) => {
      acc[u.category]?.push(u);
      return acc;
    },
    { Starters: [], Mains: [], Desserts: [] }
  );
}

export function pickMostExpensive(units) {
  if (!units.length) return undefined;
  return units.reduce((best, u) => (u.price > best.price ? u : best), units[0]);
}

function removeUnit(list, unit) {
  const idx = list.indexOf(unit);
  if (idx !== -1) list.splice(idx, 1);
}

function expandToUnits(lines) {
  const units = [];
  for (const line of lines) {
    const qty = line.quantity ?? 1;
    for (let i = 0; i < qty; i++) {
      units.push({ ...line, quantity: 1, sourceCartLineId: line.cartLineId });
    }
  }
  return units;
}

function collapseUnits(units) {
  const byLine = new Map();
  for (const u of units) {
    const key = u.sourceCartLineId;
    if (!byLine.has(key)) byLine.set(key, { ...u, quantity: 0 });
    byLine.get(key).quantity += 1;
  }
  return [...byLine.values()];
}

/**
 * @param {Array} cartLines - { ...dish, cartLineId, quantity, locked, comboGroupId }
 * @returns {{ combos: Array, leftovers: Array, fullPriceSubtotal: number, discountedSubtotal: number, subtotal: number, totalCalories: number }}
 */
export function computeCombos(cartLines) {
  const explicitLines = cartLines.filter((l) => l.locked);
  const freeLines = cartLines.filter((l) => !l.locked);

  const combos = [];
  const demoted = [];

  const groups = new Map();
  for (const line of explicitLines) {
    if (!groups.has(line.comboGroupId)) groups.set(line.comboGroupId, []);
    groups.get(line.comboGroupId).push(line);
  }

  for (const [groupId, lines] of groups) {
    const shape = validExplicitShape(lines.map((l) => l.category));
    if (shape) {
      combos.push(makeCombo(`explicit-${groupId}`, "explicit", shape, lines));
    } else {
      // a member of this locked combo was removed from the cart - the rest revert to full price
      demoted.push(...lines);
    }
  }

  const pool = expandToUnits([...freeLines, ...demoted]);
  let autoIndex = 0;

  while (true) {
    const byCategory = groupByCategory(pool);
    const starter = pickMostExpensive(byCategory.Starters);
    const main = pickMostExpensive(byCategory.Mains);
    const dessert = pickMostExpensive(byCategory.Desserts);
    if (!starter || !main || !dessert) break;
    combos.push(makeCombo(`auto-${autoIndex++}`, "auto", 3, [starter, main, dessert]));
    removeUnit(pool, starter);
    removeUnit(pool, main);
    removeUnit(pool, dessert);
  }

  while (true) {
    const byCategory = groupByCategory(pool);
    const starter = pickMostExpensive(byCategory.Starters);
    const main = pickMostExpensive(byCategory.Mains);
    const dessert = pickMostExpensive(byCategory.Desserts);

    if (starter && main) {
      combos.push(makeCombo(`auto-${autoIndex++}`, "auto", 2, [starter, main]));
      removeUnit(pool, starter);
      removeUnit(pool, main);
      continue;
    }
    if (main && dessert) {
      combos.push(makeCombo(`auto-${autoIndex++}`, "auto", 2, [main, dessert]));
      removeUnit(pool, main);
      removeUnit(pool, dessert);
      continue;
    }
    break;
  }

  const leftovers = collapseUnits(pool);

  const fullPriceSubtotal = round2(sumBy(leftovers, (l) => l.price * l.quantity));
  const discountedSubtotal = round2(sumBy(combos, (c) => c.comboTotal));
  const subtotal = round2(fullPriceSubtotal + discountedSubtotal);
  const totalCalories =
    sumBy(leftovers, (l) => (l.calories ?? 0) * l.quantity) + sumBy(combos, (c) => c.comboCalories);

  return { combos, leftovers, fullPriceSubtotal, discountedSubtotal, subtotal, totalCalories };
}

function countAutoByShape(result, shape) {
  return result.combos.filter((c) => c.type === "auto" && c.shape === shape).length;
}

/**
 * Pure diff between two computeCombos snapshots, used to decide the toast message after a cart change.
 */
export function suggestComboMessage(prevResult, nextResult) {
  if (countAutoByShape(nextResult, 3) > countAutoByShape(prevResult, 3)) {
    return { tone: "confirm", text: "Combo -7% appliqué !" };
  }
  if (countAutoByShape(nextResult, 2) > countAutoByShape(prevResult, 2)) {
    return { tone: "confirm", text: "Combo -5% appliqué !" };
  }

  const units = nextResult.leftovers.flatMap((l) => Array(l.quantity).fill(l));
  const byCategory = groupByCategory(units);

  if (byCategory.Starters.length && byCategory.Mains.length && !byCategory.Desserts.length) {
    return { tone: "suggest", text: "Ajoutez un Dessert pour -5% sur votre commande" };
  }
  if (byCategory.Mains.length && !byCategory.Starters.length && !byCategory.Desserts.length) {
    return { tone: "suggest", text: "Ajoutez une Entrée ou un Dessert pour -5% sur votre commande" };
  }

  return null;
}
