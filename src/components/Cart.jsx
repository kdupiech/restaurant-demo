import Illustration from "./Illustration";
import { openmojiUrl, UI_ICONS } from "../lib/openmoji";
import { computeCombos, computeTax } from "../lib/combos";

function CartLineItem({ line, onRemove }) {
  return (
    <li className="cart-item">
      <Illustration className="cart-item-emoji" src={line.illustration} fallback={line.emoji} alt={line.name} />
      <div className="cart-item-details">
        <span className="cart-item-name">{line.name}</span>
        <span className="cart-item-qty">x{line.quantity}</span>
      </div>
      <span className="cart-item-price">€{(line.price * line.quantity).toFixed(2)}</span>
      <button className="remove-btn" onClick={() => onRemove(line.cartLineId)}>✕</button>
    </li>
  );
}

export default function Cart({ cart, onRemove, onCheckout }) {
  const { combos, leftovers, subtotal, totalCalories } = computeCombos(cart);
  const tax = computeTax(subtotal);
  const total = subtotal + tax;

  return (
    <aside className="cart">
      <h2>Your Order</h2>

      {cart.length === 0 ? (
        <p className="cart-empty">No items yet.</p>
      ) : (
        <>
          {combos.map((combo) => (
            <div key={combo.comboId} className="combo-group">
              <span className={`combo-badge ${combo.shape === 3 ? "combo-badge--7" : ""}`}>
                Combo -{Math.round(combo.discountRate * 100)}%
              </span>
              <ul className="cart-list">
                {combo.lines.map((line) => (
                  <CartLineItem key={line.cartLineId} line={line} onRemove={onRemove} />
                ))}
              </ul>
              <div className="combo-group-total">
                <span>
                  <Illustration className="calories-icon" src={openmojiUrl(UI_ICONS.fire.codepoint)} fallback={UI_ICONS.fire.fallback} alt="calories" />
                  {" "}{combo.comboCalories} kcal
                </span>
                <span>€{combo.itemsSubtotal.toFixed(2)} → €{combo.comboTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}

          {leftovers.length > 0 && (
            <ul className="cart-list">
              {leftovers.map((line) => (
                <CartLineItem key={line.cartLineId} line={line} onRemove={onRemove} />
              ))}
            </ul>
          )}
        </>
      )}

      <div className="cart-totals">
        <div className="cart-totals-row">
          <span>Subtotal</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div className="cart-totals-row">
          <span>Tax (20%)</span>
          <span>€{tax.toFixed(2)}</span>
        </div>
        <div className="cart-totals-row total">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
        {cart.length > 0 && (
          <div className="cart-totals-row calories">
            <span>Estimated</span>
            <span>~{totalCalories} kcal</span>
          </div>
        )}
      </div>

      <button
        className="checkout-btn"
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        Place Order
      </button>
    </aside>
  );
}
