import { useState } from "react";
import Illustration from "./Illustration";
import { openmojiUrl, UI_ICONS } from "../lib/openmoji";

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="promo-banner">
      <Illustration className="promo-banner-icon" src={openmojiUrl(UI_ICONS.party.codepoint)} fallback={UI_ICONS.party.fallback} alt="" />
      <span>Composez votre menu : Entrée + Plat ou Plat + Dessert = -5% · Menu complet = -7%</span>
      <button className="promo-banner-dismiss" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}
