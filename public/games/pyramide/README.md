# Pyramide SPA

SPA statique en HTML, CSS et JavaScript vanilla pour jouer a Pyramide en pass & play sur un seul ecran.

## Fichiers

- `index.html` : structure de la page
- `style.css` : interface responsive et tactile
- `app.js` : logique de jeu, scoring, rotation d'equipe, censure du texte final
- `data/sample-pyramides.json` : jeu de donnees local
- `docs/pyramide-spa-spec.md` : specification fonctionnelle et technique

## Lancer l'application

Utiliser un serveur statique local pour que `fetch()` puisse charger le JSON.

Exemple avec Python :

```bash
python -m http.server 8080
```

Puis ouvrir :

- [http://localhost:8080/index.html](http://localhost:8080/index.html)

## Regles implementees

- 2 equipes de 2 joueurs
- 13 briques au debut de chaque manche
- 5 mots obligatoires par enigme
- reveal secret uniquement en maintien tactile
- +1 point par mot trouve
- +1 point si l'enigme finale est resolue
- bonus de briques seulement si les 5 mots ont ete trouves
- rotation automatique vers l'equipe adverse en fin de manche

## Normalisation du JSON

Le chargeur aplatit `cards[].enigmas[]`, lit la langue `fr`, et ignore toute enigme qui n'a pas exactement 5 `keywords`.
