import { useState } from "react";
import Illustration from "./Illustration";
import { COMBO_RULES } from "../lib/combos";

const SLOT_CATEGORIES = ["Starters", "Mains", "Desserts"];

export default function ComboBuilder({ dishes, onAdd, onClose }) {
  const [slots, setSlots] = useState({ Starters: null, Mains: null, Desserts: null });
  const [activeSlot, setActiveSlot] = useState("Starters");

  const filled = Object.entries(slots).filter(([, v]) => v);
  const isValid2 = filled.length === 2 && ((slots.Starters && slots.Mains) || (slots.Mains && slots.Desserts));
  const isValid3 = filled.length === 3 && slots.Starters && slots.Mains && slots.Desserts;
  const canAdd = isValid2 || isValid3;
  const shape = isValid3 ? 3 : 2;
  const discountRate = COMBO_RULES[shape];

  const itemsSubtotal = filled.reduce((sum, [, dish]) => sum + dish.price, 0);
  const discountAmount = Math.round(itemsSubtotal * discountRate * 100) / 100;
  const comboTotal = itemsSubtotal - discountAmount;
  const comboCalories = filled.reduce((sum, [, dish]) => sum + (dish.calories ?? 0), 0);

  function selectDish(dish) {
    setSlots((prev) => {
      const next = { ...prev, [dish.category]: dish };
      const order = SLOT_CATEGORIES;
      const nextEmpty = order.find((cat) => cat !== dish.category && !next[cat]);
      if (nextEmpty) setActiveSlot(nextEmpty);
      return next;
    });
  }

  function handleAdd() {
    onAdd(filled.map(([, dish]) => dish));
    onClose();
  }

  const dishesForActiveSlot = dishes.filter((d) => d.category === activeSlot);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Créer mon menu</h2>

        <div className="combo-slots">
          {SLOT_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`combo-slot ${activeSlot === cat ? "active" : ""} ${slots[cat] ? "filled" : ""}`}
              onClick={() => setActiveSlot(cat)}
            >
              <div className="combo-slot-label">{cat}</div>
              {slots[cat] ? (
                <div className="combo-slot-dish">
                  <Illustration className="combo-slot-emoji" src={slots[cat].illustration} fallback={slots[cat].emoji} alt={slots[cat].name} />
                  <span>{slots[cat].name}</span>
                </div>
              ) : (
                <div className="combo-slot-empty">Choisir</div>
              )}
            </div>
          ))}
        </div>

        <div className="dish-grid combo-builder-grid">
          {dishesForActiveSlot.map((dish) => (
            <div key={dish.id} className="dish-card" onClick={() => selectDish(dish)}>
              <Illustration className="dish-emoji" src={dish.illustration} fallback={dish.emoji} alt={dish.name} />
              <div className="dish-info">
                <h3>{dish.name}</h3>
                <span className="dish-calories">{dish.calories} kcal</span>
                <span className="dish-price">€{dish.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-totals">
          <div className="modal-totals-row">
            <span>{filled.length} plat(s) sélectionné(s)</span>
            <span>{comboCalories} kcal</span>
          </div>
          {canAdd && (
            <div className="modal-totals-row modal-totals-total">
              <span>Combo -{Math.round(discountRate * 100)}%</span>
              <span>€{itemsSubtotal.toFixed(2)} → €{comboTotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-btn-secondary" onClick={onClose}>Annuler</button>
          <button className="modal-btn-primary" disabled={!canAdd} onClick={handleAdd}>
            Ajouter le menu au panier
          </button>
        </div>
      </div>
    </div>
  );
}
