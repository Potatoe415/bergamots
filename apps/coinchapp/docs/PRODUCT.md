# PRODUCT

Status: Living document. Never edit autonomously - confirm with user first.

---

Project_Name: Coinche en ligne
Objective: Permettre de jouer un jeu de cartes (Coinche, la Bouilla, Président à 4, ou la Bataille Corse à 2) dans un navigateur (téléphone, tablette, ou desktop), en ligne avec d'autres joueurs ou contre des bots.
Problem: Les jeux de Coinche existants sont souvent des apps natives ou peu adaptés au jeu rapide entre amis via un simple lien.

Target_Users:
- Joueurs de Coinche occasionnels sur téléphone, tablette, ou navigateur desktop.
- Groupes d'amis qui veulent lancer une partie rapidement via un code de salon.

Core_Features:
- Création/rejoindre une partie via un code de salon (sans compte, pseudo anonyme).
- Sièges vides remplis par des bots (jouable même seul).
- Partie complète : enchères (annonce, coinche, surcoinche), jeu des plis, scoring.
- Règles de Coinche : 32 cartes, ordres/points atout vs non-atout, dix de der, belote, capot.
- Quatre jeux disponibles : Coinche (enchères/plis/atout), la Bouilla (barbu : 6 manches fixes, pénalités cumulées), Président/Trou du cul (combos par rang, révolution, échange forcé, classement cumulé), la Bataille Corse (2 joueurs uniquement : tributs de figures/as, tapes réflexe sur double/sandwich, résolues en comparant le temps de réaction mesuré localement chez chaque joueur, jamais le temps réseau).
- Paramètres de partie : objectif de points, difficulté des bots.
- Synchronisation temps réel entre joueurs.

Out_Of_Scope:
- Comptes utilisateurs, classement (pour l'instant). Exception limitée : un compteur combiné victoires/défaites, tous les 4 jeux confondus, stocké uniquement en local (`localStorage`, aucun compte ni backend, ne suit pas le joueur entre appareils).
- Spectateurs, chat, variantes régionales avancées.
- Annonce manuelle Belote/Rebelote (auto-détectée pour l'instant).

User_Roles:
- Joueur (membre d'une partie, occupe un siège).
- Bot (siège contrôlé par l'IA serveur).

Success_Criteria:
- Une partie peut être jouée de bout en bout (création -> enchères -> 8 plis -> score -> manche suivante -> fin).
- Les mains des adversaires ne sont jamais visibles côté client.
- Les coups illégaux sont rejetés par le serveur.

Constraints:
- Mobile-first, navigateur uniquement. La table de jeu remplit le viewport (téléphone, tablette, desktop) avec la même topologie (HUD en haut, ovale au centre, main en bas) ; les cartes gardent leurs proportions et s'agrandissent avec l'écran.
- Déploiement Git + Vercel, données sur Supabase.

Open_Questions:
- Faut-il l'annonce manuelle Belote/Rebelote et les variantes de règles ?
- Faut-il des comptes pour les statistiques à terme ?
