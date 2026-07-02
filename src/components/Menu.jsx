import Illustration from "./Illustration";
import PromoBanner from "./PromoBanner";
import { openmojiUrl, UI_ICONS } from "../lib/openmoji";

const CATEGORIES = ["All", "Starters", "Mains", "Desserts"];

export default function Menu({ dishes, selectedCategory, onCategoryChange, onAddToCart, onOpenComboBuilder }) {
  const filteredDishes = selectedCategory === "All" ? dishes : dishes.filter(dish => dish.category === selectedCategory);

  return (
    <section className="menu">
      <h2>Menu</h2>

      <PromoBanner />

      <div className="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
        <button className="filter-btn combo-builder-btn" onClick={onOpenComboBuilder}>
          Créer mon menu
        </button>
      </div>

      <div className="dish-grid">
        {filteredDishes.map((dish) => (
          <div key={dish.id} className="dish-card">
            <Illustration className="dish-emoji" src={dish.illustration} fallback={dish.emoji} alt={dish.name} />
            <div className="dish-info">
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
              <span className="dish-calories">
                <Illustration className="calories-icon" src={openmojiUrl(UI_ICONS.fire.codepoint)} fallback={UI_ICONS.fire.fallback} alt="calories" />
                {" "}{dish.calories} kcal
              </span>
              <div className="dish-footer">
                <span className="dish-price">€{dish.price.toFixed(2)}</span>
                <button className="add-btn" onClick={() => onAddToCart(dish)}>
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
