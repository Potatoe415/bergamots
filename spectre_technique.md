# AUDIT TECHNIQUE & ARCHITECTURE ACTUELLE

## 1. CARTOGRAPHIE DE LA STACK
*   **Langages & Environnement :** 
    *   **Frontend :** HTML5, CSS3, JavaScript (ES6+). Utilisation intensive de Vanilla JS sans framework lourd (React/Vue/Angular).
    *   **Backend / Services :** Firebase (utilisé pour le matchmaking et la synchronisation temps réel dans Yatzy).
*   **Frameworks & Bibliothèques :** 
    *   **Core :** Aucun framework UI. Logique métier en JS pur.
    *   **Yatzy :** Utilise des scripts externes pour `matchmaking.js`, `scoring.js`, `robot.js`.
    *   **Build :** Vite (détecté via `vite.config.js` et `package.json`).
*   **Analyse de l'Infrastructure de Build :** 
    *   **Bundler :** Vite est utilisé pour le packaging.
    *   **Scripts :** `dev`, `build`, `preview` (standards Vite).
    *   **Assets :** Gestion via le dossier `public/` et `asset/`. Les assets des jeux sont souvent colocalisés dans `public/games/[game_id]/assets/`.

## 2. ARCHITECTURE ET FLUX DE DONNÉES
*   **Structure du Repository :** 
    *   **Modèle Hub-Spoke :** Un hub central (`index.html` / `hub.js`) qui redirige vers des applications autonomes.
    *   **Core Shared :** Dossier `shared/` contenant `engine.js` et `dom.js` partagés entre le `wordplayer` et certains jeux (`olemains`).
    *   **Modularité :** Les jeux sont des dossiers indépendants dans `public/games/`, ce qui permet d'ajouter un jeu simplement en mettant à jour `hub-config.json`.
*   **Mécanisme d'Isolation :** 
    *   **Navigation :** L'application utilise la navigation navigateur classique (`window.location.href`). Chaque jeu est une page HTML distincte.
    *   **Namespacing :** Certains jeux utilisent des modules ES (`olemains`), d'autres des variables globales préfixées (`YATZY_CONFIG`) ou des closures.
*   **Gestion du Cycle de Vie (Technique) :** 
    *   **Initialisation :** Basée sur l'événement `DOMContentLoaded`. Chaque jeu possède son script d'initialisation (`init()` ou `initializeWordPlayer()`).
    *   **Nettoyage :** Comme chaque changement de jeu implique un rechargement de page, le nettoyage de la mémoire et des Event Listeners est géré nativement par le navigateur (Garbage Collection au changement de contexte).

## 3. PERFORMANCE, DETTE & RISQUES
*   **Couplage & Adhérence :** 
    *   Dépendance forte au fichier `hub-config.json` pour la découverte des jeux.
    *   `wordplayer.js` est un moteur générique mais très couplé à la structure des données JSON de `public/data/`.
*   **Gestion de la Mémoire & des Assets :** 
    *   Chargement à la demande (Lazy loading d'images dans le hub).
    *   Utilisation de base64 pour certains fallbacks SVG afin d'éviter les requêtes HTTP inutiles.
    *   Risque de duplication d'assets (sons, icônes) entre les dossiers de jeux individuels.
*   **Anti-patterns & Goulots d'étranglement :** 
    *   **Variables Globales :** Présence de variables globales dans certains vieux modules.
    *   **DRY :** La logique de modal de règles (`loadRulesIfExists`) est dupliquée ou réimplémentée de manière similaire dans plusieurs jeux.
    *   **Typage :** Absence totale de TypeScript, rendant la maintenance des structures de données complexes (comme dans Yatzy) risquée lors de refontes.
