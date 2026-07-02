import { useState, useEffect, useRef } from "react";
import { dishes, deliveryInfo } from "./data";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import PaymentModal from "./components/PaymentModal";
import Illustration from "./components/Illustration";
import ComboToast from "./components/ComboToast";
import ComboBuilder from "./components/ComboBuilder";
import { openmojiUrl, UI_ICONS } from "./lib/openmoji";
import { computeCombos, suggestComboMessage } from "./lib/combos";
import "./App.css";

export default function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPayment, setShowPayment] = useState(false);
  const [showComboBuilder, setShowComboBuilder] = useState(false);
  const [toast, setToast] = useState(null);
  const prevCombosRef = useRef(computeCombos([]));

  function addToCart(dish) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === dish.id && !item.locked);
      if (existing) {
        return prev.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...prev,
        { ...dish, cartLineId: `${dish.id}-free-${Date.now()}-${Math.random()}`, quantity: 1, locked: false, comboGroupId: null },
      ];
    });
  }

  function addComboToCart(items) {
    const comboGroupId = `combo-${Date.now()}`;
    setCart((prev) => [
      ...prev,
      ...items.map((dish) => ({
        ...dish,
        cartLineId: `${dish.id}-${comboGroupId}`,
        quantity: 1,
        locked: true,
        comboGroupId,
      })),
    ]);
  }

  function removeFromCart(cartLineId) {
    setCart((prev) => prev.filter((item) => item.cartLineId !== cartLineId));
  }

  useEffect(() => {
    const next = computeCombos(cart);
    const msg = suggestComboMessage(prevCombosRef.current, next);
    prevCombosRef.current = next;
    if (msg) {
      setToast(msg);
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <img src="/restaurant-demo/deliveroo-logo.png" alt="Deliveroo" height="36" />
          <h1>roo<span style={{color:"#1a271f"}}>food</span></h1>
          <span className="delivery-eta">
            <span className="eta-dot" />
            <Illustration className="eta-icon-img" src={openmojiUrl(UI_ICONS.delivery.codepoint)} fallback={UI_ICONS.delivery.fallback} alt="delivery" />
            Delivery in {deliveryInfo.etaMin}–{deliveryInfo.etaMax} min
          </span>
        </div>
        <div className="cart-badge-wrapper">
          <Illustration className="cart-icon-img" src={openmojiUrl(UI_ICONS.cart.codepoint)} fallback={UI_ICONS.cart.fallback} alt="cart" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
      </header>

      <main className="app-main">
        <Menu
          dishes={dishes}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAddToCart={addToCart}
          onOpenComboBuilder={() => setShowComboBuilder(true)}
        />
        <Cart cart={cart} onRemove={removeFromCart} onCheckout={() => setShowPayment(true)} />
      </main>
      {showPayment && (
        <PaymentModal
          cart={cart}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setCart([]); setShowPayment(false); }}
        />
      )}
      {showComboBuilder && (
        <ComboBuilder
          dishes={dishes}
          onAdd={addComboToCart}
          onClose={() => setShowComboBuilder(false)}
        />
      )}
      <ComboToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
