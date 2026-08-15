# Backlog Dice Duel

## Phase 1 : Initialisation & Structure
- [ ] Créer `index.html` : Structure de base, méta tags (mobile-first, anti-zoom), conteneurs pour l'écran d'accueil, l'arène de jeu, les modals et l'écran interstitiel.
- [ ] Créer `style.css` : Définition des variables CSS globales (palette Studio Ghibli, organiques), styles de base, animations, grid/flexbox pour l'agencement mobile, et classes utilitaires.
- [ ] Créer `js/storage.js` : Module de gestion du `LocalStorage` pour la sauvegarde et restauration de l'état.

## Phase 2 : Moteur Logique (Engine)
- [ ] Créer `js/engine.js` :
  - Machine à état (HOME, P1_TURN, INTERSTITIAL, P2_TURN, RESOLUTION, GAME_OVER).
  - Gestion de la boucle de jeu (lancers, conservation des dés).
  - Implémentation du "Dé Caché".
  - Implémentation du "Pacte de Sang".
  - Calculateur de combinaisons (Paire, Brelan, Full, etc.) et de dégâts.
  - Gestion des points de Rage et des Boucliers.

## Phase 3 : Intelligence Artificielle (Bot)
- [ ] Intégrer la logique du Bot dans `js/engine.js` :
  - Délai cognitif simulé (setTimeout).
  - Algorithme de sélection (Greedy) pour conserver les dés.
  - Déclenchement conditionnel du Pacte de Sang.

## Phase 4 : Interface Utilisateur (UI)
- [ ] Créer `js/ui.js` :
  - Rendu dynamique du plateau (Dés, Scores, PV, Rage, Statuts).
  - Masquage conditionnel du Dé Caché pour l'adversaire (affichage "?").
  - Gestion des clics (sélection des dés, relance, pacte de sang, validation).
  - Animations CSS synchronisées (dégâts, transitions d'état).

## Phase 5 : Assemblage & Finitions
- [ ] Créer `js/main.js` : Point d'entrée, initialisation des modules, gestion du menu principal (choix du mode PvP ou PvE), liaison entre l'Engine et l'UI.
- [ ] Test et ajustements finaux (vérification du respect de toutes les contraintes, absence de backend, bon fonctionnement du LocalStorage).