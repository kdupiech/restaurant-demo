const OPENMOJI_VERSION = "15.0.0";

export function openmojiUrl(codepoint) {
  return `https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}/color/svg/${codepoint}.svg`;
}

export const UI_ICONS = {
  cart: { codepoint: "1F6D2", fallback: "🛒" },
  delivery: { codepoint: "1F6F5", fallback: "🛵" },
  success: { codepoint: "2705", fallback: "✓" },
  party: { codepoint: "1F389", fallback: "🎉" },
  fire: { codepoint: "1F525", fallback: "🔥" },
};
