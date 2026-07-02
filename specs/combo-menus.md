# Spec — Menus combinés, bannière promo, calories, illustrations

Statut : brouillon — à valider avant développement

## 1. Contexte

État actuel du panier (`src/data.js`, `src/App.jsx`, `src/components/*`) :
- Chaque plat a : `id`, `name`, `description`, `price`, `category` (`Starters` / `Mains` / `Desserts`), `emoji`.
- Le panier est une liste plate d'items avec `quantity`, sans notion de "combo".
- Pas de champ calories.
- Pas de bannière promotionnelle.

## 2. Feature A — Menus combinés avec réduction

### Règles de réduction
| Combo | Réduction |
|---|---|
| Starter + Main | 5% |
| Main + Dessert | 5% |
| Starter + Main + Dessert | 7% |

### Décision (validée)
Mode **hybride** :
- L'utilisateur peut **composer explicitement** un menu combiné (sélection manuelle d'un Starter/Main/Dessert à assembler en combo).
- Pour tout ce qui n'a **pas** été composé explicitement, le système applique une **détection automatique** sur le reste du panier.
- Les items déjà verrouillés dans un combo explicite ne sont plus éligibles à la détection auto (pas de double comptage).

### Algorithme de détection automatique
1. Ne considérer que les items du panier **non déjà affectés** à un combo explicite.
2. Former le maximum de combos **3 items** (Starter+Main+Dessert, -7%) en priorité, puis des combos **2 items** (Starter+Main ou Main+Dessert, -5%) avec ce qu'il reste.
3. **Règle du "plus cher"** : si plusieurs candidats existent pour un même rôle (ex: 2 Starters différents en stock dans le panier), le combo auto sélectionne l'item **le plus cher** de chaque catégorie disponible pour maximiser la valeur du combo formé. L'item moins cher retombe au prix normal (ou sert à former un combo suivant s'il reste assez d'items).
4. Répéter tant que des combinaisons restent possibles ; le surplus non combinable reste facturé au prix plein.
5. La réduction s'applique sur la somme des prix des items du combo uniquement (pas sur le sous-total global).
6. La taxe (20%) s'applique après réduction combo : `tax = subtotal_après_combo * 0.20`.

### Exemple
Panier : Bruschetta (6.5, Starter), Caesar Salad (7.0, Starter), Classic Burger (14.0, Main), Tiramisu (7.0, Dessert).
→ 1 seul Main et 1 seul Dessert disponibles ⇒ un seul combo 3-items possible. Entre les deux Starters, le système choisit **Caesar Salad (7.0)** pour le combo (plus cher que Bruschetta) ⇒ combo Caesar Salad + Classic Burger + Tiramisu à -7%. Bruschetta reste au prix normal.

### Affichage dans le panier
- Les items formant un combo (explicite ou auto) sont regroupés visuellement avec un badge "Combo -5%" / "Combo -7%".
- Le détail du panier distingue clairement : items en combo (prix réduit affiché) vs. items au prix normal.

### UI de composition explicite — mode "Créer mon menu" (décidé)
- Bouton/entrée "Créer mon menu" (dans le Menu, à côté des filtres de catégorie ou en CTA dédié).
- Ouvre un mode avec **3 emplacements** à remplir : Starter / Main / Dessert.
- L'utilisateur choisit un plat par emplacement en cliquant sur les plats du menu (le menu se filtre/indique la catégorie attendue pour l'emplacement actif) ; possibilité de ne remplir que 2 des 3 emplacements (Starter+Main ou Main+Dessert) pour un combo à -5% si le dessert/starter n'est pas souhaité.
- Une fois les emplacements requis remplis, un bouton "Ajouter le menu au panier" ajoute les items au panier **déjà marqués comme combo verrouillé** (non ré-évalués par la détection auto).
- Les emplacements vides restent optionnels seulement pour le combo 2-items ; le combo 3-items nécessite les 3 emplacements remplis.

### Points encore ouverts (mineurs, à trancher pendant le dev)
- Arrondi de la réduction (au centime le plus proche, `toFixed(2)`).
- Détail visuel exact du mode "Créer mon menu" (overlay/modal vs. panneau inline).

## 3. Feature B — Bannière promotionnelle

### Objectif
Informer l'utilisateur de l'existence des menus combinés et de leur avantage.

### Décision (validée) — les deux emplacements, dismissible
1. **Bannière statique** en haut du Menu (sous le header), informative, présente dès l'arrivée sur la page.
   - Texte : "Composez votre menu : Entrée + Plat ou Plat + Dessert = -5% · Menu complet = -7%"
   - Dismissible (bouton ✕), état de fermeture non persistant entre sessions (redevient visible au reload — pas de `localStorage` prévu, hors scope sauf demande contraire).
2. **Bannière contextuelle / recommandation poussée** quand l'utilisateur ajoute un item au panier : si l'ajout complète (ou rapproche d'un) combo possible, afficher une notif ponctuelle (toast ou bandeau temporaire) — ex: "Ajoutez un Dessert pour -5% sur votre commande" quand le panier contient déjà Starter+Main sans Dessert, ou "Combo -7% appliqué !" quand un combo 3-items vient de se former automatiquement.
   - Dismissible également ; disparaît seule après quelques secondes ou au clic.
   - Se déclenche après chaque `addToCart`, recalcule l'état combo courant pour décider du message à pousser (ou de ne rien pousser si aucun combo n'est proche/atteint).

### Points encore ouverts (mineurs)
- Durée d'auto-disparition de la notif contextuelle (ex: 4s) et animation d'entrée/sortie exactes.

## 4. Feature C — Impact calorique

### Modèle de données
Ajouter un champ `calories` (nombre, kcal) à chaque plat dans `src/data.js`.

### Décision (validée) — API gratuite : CalorieNinjas
- Endpoint : `GET https://api.calorieninjas.com/v1/nutrition?query=<nom du plat>`, header `X-Api-Key: <clé>`.
- Gratuit avec inscription (clé API requise), requête en langage naturel — bien adapté à des noms de plats (ex: "Classic Burger", "Margherita Pizza").
- ⚠️ Risque : la doc CalorieNinjas indique une migration en cours vers **API Ninjas** (même éditeur, plateforme multi-API) — à revalider au moment du dev, avec repli possible sur `api-ninjas.com` (même mécanisme d'auth par header `X-Api-Key`).

### Approche d'intégration
- **Pas d'appel runtime depuis le navigateur** : la clé API ne doit pas être exposée dans le bundle client, et un appel à chaque chargement de page serait fragile (rate limit, dispo du service, CORS).
- **Récupération en amont** (script one-off exécuté en dev, ex: `scripts/fetch-calories.mjs`) qui interroge l'API pour chacun des 12 plats et écrit les valeurs obtenues directement dans `src/data.js` (champ `calories`, en kcal, arrondi à l'entier).
- Si une requête ne retourne rien d'exploitable (ex: "Soup of the Day" trop vague), fallback sur une requête basée sur `description` du plat, sinon valeur estimée manuellement et clairement commentée comme telle dans `data.js`.

### Affichage
1. **Par item** — Sur la carte plat (Menu) et dans la liste du panier, à côté du prix (ex: "🔥 320 kcal").
2. **Par combo** — Quand un combo est formé, afficher le total calorique du set (somme des items du combo) à côté de la réduction.
3. **Total panier** — Ligne "Total estimé" sous les totaux prix dans `cart-totals`, clairement distincte du prix (ex: "~890 kcal").

## 5. Feature D — Remplacement des emojis par des illustrations

### Portée
Les emojis sont utilisés dans : `Menu.jsx` (carte plat), `Cart.jsx` (liste panier), `PaymentModal.jsx` (résumé + reçu), header (`🛒`, `🛵`).

### Décision (validée) — OpenMoji via CDN, référencées par lien
- Source : **OpenMoji** (licence CC BY-SA 4.0, gratuite, style illustratif coloré "cartoonish" — plus proche de l'esprit demandé qu'un style flat comme Twemoji).
- Hébergement : CDN public **jsdelivr**, pas de fichier à héberger dans le repo — juste une URL par plat.
- Format d'URL vérifié fonctionnel : `https://cdn.jsdelivr.net/npm/openmoji@<version>/color/svg/<CODEPOINT>.svg` (ex: `.../1F354.svg` pour le hamburger). Version à figer (ex: `15.0.0`) plutôt que `@latest`, pour éviter qu'une mise à jour du package casse silencieusement une icône.
- ⚠️ **Vérification manuelle requise** : la correspondance codepoint → plat doit être validée visuellement dans le navigateur pendant le dev (impossible de confirmer le rendu visuel exact par un simple fetch). Prévoir cette vérification avant merge.
- Attribution : mentionner "Illustrations: OpenMoji (CC BY-SA 4.0)" dans le README ou le footer.

### Périmètre du remplacement (décidé) — TOUS les emojis
Remplacement complet, pas seulement les emojis de plats :
| Emoji actuel | Emplacement | Codepoint(s) à mapper |
|---|---|---|
| `dish.emoji` (🍞🍲🦐🥗🍔🐟🍕🍚🍛🍫🍮☕) | `Menu.jsx`, `Cart.jsx`, `PaymentModal.jsx` | 1 par plat, voir §6 |
| 🛒 (icône panier) | Header (`App.jsx`) | U+1F6D2 |
| 🛵 (icône livraison) | Header, pastille ETA (`App.jsx`) | U+1F6F5 |
| ✓ (succès paiement) | `PaymentModal.jsx` step "success" | U+2713 ou U+2705 (✅) — à choisir un style cohérent avec le reste (icône de validation ronde/verte plutôt que coche nue) |
| 🎉 (bannière promo, nouveau) | Bannière combo | U+1F389 |

- Chaque emoji d'UI devient une balise `<img>` OpenMoji au lieu d'un caractère Unicode, avec la même logique de fallback (`onError` → emoji d'origine conservé en commentaire/valeur de repli).
- Attention aux tailles : les icônes UI (panier, livraison) sont actuellement dimensionnées via la taille de police (emoji inline dans du texte) — passer à `<img>` nécessite de fixer une `height`/`width` explicite en CSS pour préserver l'alignement avec le texte environnant.

### Format et emplacement
- Nouveau champ `illustration` dans `data.js` contenant l'URL complète OpenMoji (pas de fichier local, pas de dossier d'assets).
- **Fallback** : si `illustration` est absent/en erreur de chargement (`onError` sur `<img>`), fallback vers `dish.emoji` — le champ `emoji` est donc conservé dans `data.js` comme filet de sécurité, pas supprimé.

## 6. Modèle de données — changements proposés dans `src/data.js`

```js
{
  id: 1,
  name: "Bruschetta",
  description: "...",
  price: 6.5,
  category: "Starters",
  calories: 180,        // nouveau — récupéré via script one-off + CalorieNinjas, en kcal
  illustration: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F35E.svg", // nouveau
  emoji: "🍞",          // conservé comme fallback si l'illustration ne charge pas
}
```

## 7. Hors scope (à confirmer)
- Réductions cumulables avec d'autres promotions futures.
- Valeurs caloriques certifiées / nutritionnelles réelles — ce sont des estimations pour la démo.
- Persistance de la fermeture de la bannière statique entre sessions (`localStorage`) — redevient visible au reload.

## 8. Décisions validées
- [x] Combos : mode hybride — composition explicite via "Créer mon menu" (3 emplacements) + détection auto sur le reste, règle du "plus cher" en cas de choix multiples (§2)
- [x] Bannière : statique en haut + notif contextuelle poussée à l'ajout au panier, les deux dismissibles (§3)
- [x] Calories : API CalorieNinjas, récupération en amont via script one-off, pas d'appel runtime (§4)
- [x] Illustrations : OpenMoji via CDN jsdelivr, référencées par URL — remplacement de **tous** les emojis (plats + UI), fallback emoji conservé (§5)

## 9. Points encore ouverts (mineurs, à trancher pendant le dev, non bloquants)
- [ ] Détail visuel du mode "Créer mon menu" (overlay/modal vs. panneau inline) (§2)
- [ ] Durée d'auto-disparition de la notif contextuelle (§3)
- [ ] Version exacte d'OpenMoji à figer + vérification visuelle de tous les codepoints (plats + UI) (§5)
- [ ] Style de l'icône de succès paiement : coche simple (✓, U+2713) vs. badge de validation (✅, U+2705) (§5)
- [ ] Confirmer au moment du dev si CalorieNinjas est toujours actif ou basculé vers api-ninjas.com (§4)
