import { useState, useEffect } from "react";
import Illustration from "./Illustration";
import { openmojiUrl, UI_ICONS } from "../lib/openmoji";
import { computeCombos, computeTax } from "../lib/combos";

function generateOrderNumber() {
  return "DL-" + Math.floor(10000 + Math.random() * 90000);
}

function ModalItemRow({ line }) {
  return (
    <li className="modal-item-row">
      <Illustration className="modal-item-emoji" src={line.illustration} fallback={line.emoji} alt={line.name} />
      <span className="modal-item-name">{line.name}</span>
      <span className="modal-item-qty">x{line.quantity}</span>
      <span className="modal-item-price">€{(line.price * line.quantity).toFixed(2)}</span>
    </li>
  );
}

function ModalItemList({ combos, leftovers, receipt }) {
  return (
    <>
      {combos.map((combo) => (
        <div key={combo.comboId} className="combo-group">
          <span className={`combo-badge ${combo.shape === 3 ? "combo-badge--7" : ""}`}>
            Combo -{Math.round(combo.discountRate * 100)}%
          </span>
          <ul className={`modal-item-list ${receipt ? "modal-item-list--receipt" : ""}`}>
            {combo.lines.map((line) => (
              <ModalItemRow key={line.cartLineId} line={line} />
            ))}
          </ul>
          <div className="combo-group-total">
            <span>{combo.comboCalories} kcal</span>
            <span>€{combo.itemsSubtotal.toFixed(2)} → €{combo.comboTotal.toFixed(2)}</span>
          </div>
        </div>
      ))}
      {leftovers.length > 0 && (
        <ul className={`modal-item-list ${receipt ? "modal-item-list--receipt" : ""}`}>
          {leftovers.map((line) => (
            <ModalItemRow key={line.cartLineId} line={line} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function PaymentModal({ cart, onClose, onSuccess }) {
  const { combos, leftovers, subtotal, totalCalories } = computeCombos(cart);
  const tax = computeTax(subtotal);
  const total = subtotal + tax;

  const [step, setStep] = useState("summary");
  const [orderNumber] = useState(generateOrderNumber);
  const [orderTime] = useState(() => new Date());
  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvv: "" });

  useEffect(() => {
    if (step !== "processing") return;
    const timer = setTimeout(() => setStep("success"), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  function handleOverlayClick() {
    if (step !== "processing") onClose();
  }

  function handleNumberChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setForm((f) => ({ ...f, number: formatted }));
  }

  function handleExpiryChange(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = raw.length > 2 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw;
    setForm((f) => ({ ...f, expiry: formatted }));
  }

  const canPay =
    form.name.trim() &&
    form.number.replace(/\s/g, "").length === 16 &&
    form.expiry.length === 5 &&
    form.cvv.length >= 3;

  const formattedTime = orderTime.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {step === "summary" && (
          <div className="modal-step">
            <h2 className="modal-title">Order Summary</h2>
            <ModalItemList combos={combos} leftovers={leftovers} />
            <div className="modal-totals">
              <div className="modal-totals-row">
                <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="modal-totals-row">
                <span>Tax (20%)</span><span>€{tax.toFixed(2)}</span>
              </div>
              <div className="modal-totals-row modal-totals-total">
                <span>Total</span><span>€{total.toFixed(2)}</span>
              </div>
              <div className="modal-totals-row calories">
                <span>Estimated</span><span>~{totalCalories} kcal</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
              <button className="modal-btn-primary" onClick={() => setStep("card")}>
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {step === "card" && (
          <div className="modal-step">
            <h2 className="modal-title">Payment Details</h2>
            <div className="card-form">
              <label className="card-label">
                Name on card
                <input
                  className="card-input"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="card-label">
                Card number
                <input
                  className="card-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={form.number}
                  onChange={handleNumberChange}
                />
              </label>
              <div className="card-row">
                <label className="card-label">
                  Expiry
                  <input
                    className="card-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={handleExpiryChange}
                  />
                </label>
                <label className="card-label">
                  CVV
                  <input
                    className="card-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    value={form.cvv}
                    onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={() => setStep("summary")}>Back</button>
              <button
                className="modal-btn-primary"
                disabled={!canPay}
                onClick={() => setStep("processing")}
              >
                Pay €{total.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="modal-step modal-step-centered">
            <div className="spinner" />
            <p className="processing-title">Processing your payment…</p>
            <p className="processing-subtitle">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="modal-step modal-step-centered">
            <div className="success-icon">
              <Illustration className="success-icon-img" src={openmojiUrl(UI_ICONS.success.codepoint)} fallback={UI_ICONS.success.fallback} alt="Success" />
            </div>
            <h2 className="success-title">Payment Successful!</h2>
            <p className="success-meta">Order {orderNumber} · {formattedTime}</p>
            <ModalItemList combos={combos} leftovers={leftovers} receipt />
            <div className="modal-totals">
              <div className="modal-totals-row modal-totals-total">
                <span>Total paid</span><span>€{total.toFixed(2)}</span>
              </div>
            </div>
            <button className="modal-btn-primary modal-btn-full" onClick={onSuccess}>
              Start New Order
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
