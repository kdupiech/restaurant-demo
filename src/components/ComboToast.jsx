export default function ComboToast({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div className={`combo-toast combo-toast--${toast.tone}`} role="status">
      <span>{toast.text}</span>
      <button className="combo-toast-dismiss" onClick={onDismiss}>✕</button>
    </div>
  );
}
