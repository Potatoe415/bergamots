# SPÉCIFICATIONS FONCTIONNELLES (REVERSE ENGINEERING)

## 1. FONCTIONNALITÉS DE LA PLATEFORME (LE CORE)
*   **Gestion de Session & Profil :** 
    *   La persistence est principalement locale (`LocalStorage` pour la langue, les paramètres de Yatzy).
    *   Pas de compte utilisateur centralisé (anonymat par défaut).
    *   Les états de jeu sont parfois passés via URL (ex: `?game=pictionary`).
*   **Le Hub / Catalogue :** 
    *   Grille dynamique de tuiles de jeux chargée depuis `hub-config.json`.
    *   Trois types de lancements : `wordpack` (moteur interne), `custom` (app locale), `external` (lien externe).
    *   Gestion de fallbacks d'images (JPG -> PNG -> SVG généré).
*   **Système de Progression & Scores :** 
    *   Scores locaux par session de jeu (non persistés entre les rechargements pour la plupart des jeux).
    *   Yatzy gère un état de score complexe avec des règles de "Upper section" et "Lower section".

## 2. MOTEUR ET RÈGLES DE JEU (PAR JEU DÉTECTÉ)

### A. WordPlayer Engine (Pictionary, Taboo, Esquisse, Pigeon Pigeon)
*   **Concept :** Jeu de devinettes basé sur des listes de mots.
*   **États :** Configuration (Choix du timer) -> Jeu (Affichage mot, Masquage, Validation) -> Fin (Stats).
*   **Règles :** Mots Tabous (pour Taboo), Catégories colorées, Système de "Défi".
*   **Contrôles :** Boutons Valider / Passer / Suivant. Double-clic pour masquer le mot.

### B. Black Stories
*   **Concept :** Énigmes sombres à résoudre par déduction.
*   **Boucle :** Lecture titre/énigme courte -> Réflexion -> Clic pour révéler la solution complète.
*   **Fonctionnalités :** Navigation dans l'historique (Précédent/Suivant aléatoire), Support multilingue temps réel, Illustrations dynamiques par ID de story.

### C. Olé Mains
*   **Concept :** Faire deviner un maximum de mots en un temps limité.
*   **Boucle :** Choix du paquet (Deck) -> Décompte -> Affichage des mots successifs -> Scoring final.
*   **Règles :** 1 point par mot validé, 0 par mot passé.

### D. Yatzy (Le plus complexe)
*   **Concept :** Poker menteur avec des dés.
*   **Boucle :** Lancer (max 3) -> Garder des dés -> Choisir une catégorie de score.
*   **Règles métier :** Calcul automatique des scores (Full, Carré, Suites), Bonus de 35 points si la section supérieure > 63, Gestion des "Yatzy" (5 dés identiques).
*   **Multijoueur :** Mode en ligne avec codes de salon (3 caractères) via Firebase.

### E. Autres jeux (Millionaire, Salade de Cafards, Pyramide)
*   Implémentations sur mesure avec leurs propres fichiers JSON de questions/règles.

## 3. MATRICE DE CONSERVATION POUR LA REFONTE
*   **Logique Métier Pure :** 
    *   Algorithmes de scoring de Yatzy (`scoring.js`).
    *   Moteur de sélection aléatoire sans répétition immédiate (`pullRandomWord`).
    *   Logique de chargement i18n dynamique.
*   **Contraintes d'Expérience Utilisateur (UX) :** 
    *   Fluidité du passage d'un mot à l'autre (réactivité).
    *   Feedback visuel immédiat (animations de dés dans Yatzy, barre de timer).
    *   Support multilingue (FR/EN/ES) intégré nativement.
