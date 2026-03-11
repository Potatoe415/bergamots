# SPA "Pyramide" - Specification technique UI/UX et logique d'etat

## 1. Objectif produit

Construire une SPA tactile "pass & play" pour 4 joueurs assis autour d'un seul ecran, avec une contrainte forte d'asymetrie d'information :

- `SYNO` ne doit jamais voir par accident les informations reservees a `DICO`.
- Toute information secrete est masquee par defaut.
- Toute revelation est conditionnee a une action volontaire et continue de `DICO`.
- L'interface privilegie la lisibilite, le contraste, la sobriete visuelle et de gros points de contact tactiles.

La SPA doit faire respecter strictement le cycle de tour suivant :

1. `SETUP`
2. `WORD_LOOP` repete 5 fois
3. `FINAL_RIDDLE`
4. `ROUND_SUMMARY`

---

## 2. Contraintes UX non negociables

## 2.1 Separation public / secret

- La partie haute de l'ecran est toujours publique.
- La partie basse est la zone `DICO`, avec fond distinct, etiquette explicite et composants limites aux actions secrete/validation.
- Les secrets ne doivent jamais etre visibles au simple tap.
- Un secret ne reste jamais affiche apres `pointerup`, `pointercancel`, `pointerleave`, perte de focus, changement d'etat ou changement d'enigme.

## 2.2 Interaction anti-triche

- Le mot courant et la solution finale utilisent un composant de type `HoldToReveal`.
- Le contenu ne s'affiche que tant que le pointeur reste appuye.
- Aucun mode "toggle", "double tap", "click to show" ou memorisation du dernier etat n'est autorise.
- La zone de reveal doit etre suffisamment grande pour eviter les erreurs de manipulation.

## 2.3 Accessibilite et tactilite

- Taille minimale des cibles tactiles : `56px`.
- Corps de texte public : `clamp(24px, 3vw, 40px)` minimum pour les titres importants.
- Contraste cible : niveau WCAG AA au minimum, idealement AAA pour les textes critiques.
- Les boutons d'action "Trouve", "Rate", "Commencer", "Passer la tablette" doivent etre visuellement inequivoques.

---

## 3. Contrat de donnees

## 3.1 Modele cible de la SPA

Le moteur de jeu doit travailler sur un modele normalise simple :

```ts
type Enigma = {
  id: string;
  clue: string;
  keywords: [string, string, string, string, string];
  text: string;
  answer: string;
};
```

```ts
type TeamScore = {
  teamId: "A" | "B";
  name: string;
  points: number;
};
```

## 3.2 Format source observe dans `sample-pyramides.json`

Le fichier fourni ne correspond pas exactement au modele cible :

- il contient `batch_id` puis `cards[]`
- chaque carte contient `enigmas[]`
- `clue`, `keywords`, `text`, `answer` sont multilingues (`fr`, `en`, `es`)
- certaines enigmes n'ont pas exactement 5 mots-clefs selon la langue
- certains caracteres accentues semblent mal encodes dans l'exemple lu

## 3.3 Regle de normalisation recommandee

Le chargeur doit :

1. aplatir `cards[].enigmas[]`
2. choisir une langue active, par defaut `fr`
3. extraire :
   - `id`
   - `clue[locale]`
   - `keywords[locale]`
   - `text[locale]`
   - `answer[locale]`
4. trim des chaines
5. rejeter toute enigme invalide

Une enigme est invalide si :

- `clue` est vide
- `text` est vide
- `answer` est vide
- `keywords` n'est pas un tableau
- `keywords.length !== 5`
- un des 5 keywords est vide

Recommandation : ne pas essayer d'adapter automatiquement les cartes a 4 ou 6 mots si la regle produit exige strictement 5 manches. Il vaut mieux les exclure du deck jouable et journaliser un warning.

## 3.4 Pseudo-code de normalisation

```ts
function normalizeDeck(raw: RawBatch, locale = "fr"): Enigma[] {
  return raw.cards
    .flatMap((card) => card.enigmas)
    .map((item) => ({
      id: String(item.id),
      clue: item.clue?.[locale]?.trim() ?? "",
      text: item.text?.[locale]?.trim() ?? "",
      answer: item.answer?.[locale]?.trim() ?? "",
      keywords: item.keywords?.[locale]?.map((k) => k.trim()) ?? [],
    }))
    .filter(isValidEnigma);
}
```

---

## 4. Etat global de l'application

Separarer l'etat `game session` de l'etat `round`.

## 4.1 Etat de session

```ts
type GameSessionState = {
  deck: Enigma[];
  usedEnigmaIds: string[];
  activeTeamIndex: 0 | 1;
  teams: [TeamScore, TeamScore];
  locale: "fr" | "en" | "es";
};
```

## 4.2 Etat de manche

```ts
type WordResult = {
  keyword: string;
  bet: number;
  success: boolean;
};
```

```ts
type RoundPhase = "SETUP" | "WORD_LOOP" | "FINAL_RIDDLE" | "ROUND_SUMMARY";
```

```ts
type RoundState = {
  phase: RoundPhase;
  enigma: Enigma;
  bricksRemaining: number; // initialise a 13
  currentWordIndex: 0 | 1 | 2 | 3 | 4;
  currentBet: number | null;
  wordResults: WordResult[]; // 0 a 5 elements
  finalSolved: boolean | null; // null tant que non statue
  reveal: {
    keywordVisible: boolean;
    answerVisible: boolean;
  };
};
```

## 4.3 Derives calcules

```ts
const wordsFoundCount = round.wordResults.filter((r) => r.success).length;
const failedKeywords = round.wordResults
  .filter((r) => !r.success)
  .map((r) => r.keyword);
const allFiveWordsFound = round.wordResults.length === 5 && failedKeywords.length === 0;
const canEnterFinal = round.wordResults.length === 5;
const bonusPoints = allFiveWordsFound ? round.bricksRemaining : 0;
```

---

## 5. Machine a etats de reference

## 5.1 Etat `SETUP`

### Affichage

- equipe active
- titre-indice `clue` en tres grand
- capital initial : `13 Briques`
- score courant des deux equipes
- bouton principal `Commencer l'enigme`

### Entree d'etat

- `bricksRemaining = 13`
- `currentWordIndex = 0`
- `currentBet = null`
- `wordResults = []`
- `finalSolved = null`
- `reveal.keywordVisible = false`
- `reveal.answerVisible = false`

### Transition sortante

- `Commencer l'enigme` -> `WORD_LOOP`

## 5.2 Etat `WORD_LOOP`

Cet etat dure tant que `currentWordIndex < 5`.

### Zone publique

- briques restantes
- progression `Mot X/5`
- score des equipes

### Zone secrete `DICO`

- rappel discret `Zone DICO`
- saisie du pari
- bouton `Maintenir pour voir le mot`
- mot visible seulement pendant l'appui

### Regles de pari

- entier positif strict
- `min = 1`
- `max = bricksRemaining`
- aucune validation possible tant qu'un pari valide n'est pas saisi

### Actions

- `Trouve`
  - precondition : pari valide
  - ajoute `+1` point a l'equipe active
  - soustrait le pari de `bricksRemaining`
  - ajoute `wordResults.push({ keyword, bet, success: true })`
  - cache immediatement le mot
  - passe au mot suivant ou a `FINAL_RIDDLE`

- `Rate`
  - precondition : pari valide
  - n'ajoute aucun point
  - soustrait le pari de `bricksRemaining`
  - ajoute `wordResults.push({ keyword, bet, success: false })`
  - cache immediatement le mot
  - passe au mot suivant ou a `FINAL_RIDDLE`

### Gardes

- si `bricksRemaining === 0` avant la fin des 5 mots, on continue quand meme le flux jusqu'au mot 5, mais les controles de pari deviennent bloques
- deux options possibles :
  - stricte : interdire la validation tant qu'il n'y a plus de briques et forcer un echec technique
  - recommandee : des que `bricksRemaining === 0`, auto-enregistrer tous les mots restants en `Rate` avec `bet = 0`

Pour une implementation sans ambiguite, choisir la version recommandee afin d'eviter un tour bloquant.

## 5.3 Etat `FINAL_RIDDLE`

### Affichage public

- phrase complete `text`
- tous les mots rates sont remplaces par `[______]`
- les mots trouves restent affiches

### Zone secrete `DICO`

- bouton `Maintenir pour voir la solution`
- solution visible seulement pendant l'appui

### Actions

- `Enigme resolue`
  - ajoute `+1` point a l'equipe active
  - `finalSolved = true`
  - va a `ROUND_SUMMARY`

- `Echec`
  - n'ajoute aucun point
  - `finalSolved = false`
  - va a `ROUND_SUMMARY`

## 5.4 Etat `ROUND_SUMMARY`

### Logique automatique d'entree

- si `allFiveWordsFound === true`, ajouter automatiquement `bricksRemaining` au score de l'equipe active
- sinon, aucun bonus

### Affichage

- recap rapide de la manche :
  - titre-indice
  - mots trouves / 5
  - enigme finale reussie ou non
  - bonus applique ou non
- tableau des scores
- bouton `Passer la tablette a l'equipe adverse`

### Transition sortante

- selection de la prochaine enigme non jouee
- `activeTeamIndex = activeTeamIndex === 0 ? 1 : 0`
- creation d'une nouvelle manche en `SETUP`

Si le deck est epuise :

- afficher un ecran de fin de partie
- ne jamais recycler automatiquement les enigmes sans action explicite utilisateur

---

## 6. Barreme de score exact

Le score d'equipe evolue exclusivement ainsi :

- `+1` pour chaque mot trouve
- `-0` pour un mot rate, seul le stock de briques baisse
- `+1` si l'enigme finale est resolue
- `+bricksRemaining` en bonus uniquement si les 5 mots ont ete trouves

Important :

- le cout en briques n'est jamais converti en points negatifs
- le bonus final n'est pas conditionne a la resolution de l'enigme finale, seulement au fait que les 5 mots aient ete trouves

---

## 7. Composants UI recommandes

## 7.1 `GameScreen`

Conteneur principal plein ecran.

Responsabilites :

- charger l'etat courant
- router l'affichage selon `phase`
- fournir les callbacks de transition

## 7.2 `PublicHeader`

Affiche :

- equipe active
- score des equipes
- briques restantes
- progression

Toujours visible sauf adaptation mineure sur l'ecran de bilan.

## 7.3 `ClueHero`

Bloc de mise en avant du `clue` pendant `SETUP`.

## 7.4 `SecretPanel`

Panneau fixe ou semi-fixe en bas d'ecran.

Contient selon le contexte :

- saisie du pari
- reveal du mot
- reveal de la solution
- boutons de validation

Style :

- fond contraste et distinct du fond public
- delimitation nette
- libelle `Reserve a DICO`

## 7.5 `BetInput`

Composant de saisie numerique :

- `inputmode="numeric"`
- pas de clavier alphanumerique
- stepper optionnel avec gros boutons `-` et `+`
- validation immediate du range `[1, bricksRemaining]`

Recommandation UX : sur tablette, preferer un stepper + keypad numerique maison plutot qu'un simple `input type="number"`, souvent mediocre selon les navigateurs tactiles.

## 7.6 `HoldToReveal`

Composant critique de securite visuelle.

Props recommandees :

```ts
type HoldToRevealProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};
```

Comportement :

- au `pointerdown`, capturer le pointeur et afficher la valeur
- au `pointerup`, `pointercancel`, `pointerleave`, `lostpointercapture`, `blur`, masquer
- empecher le menu contextuel et la selection de texte
- ne jamais conserver la valeur rendue dans le DOM quand elle est cachee si l'on veut maximiser la prudence

Implementation recommandee :

- rendre un placeholder neutre quand cache
- rendre `value` uniquement si `isPressed === true`

## 7.7 `WordActionBar`

Boutons principaux :

- `Trouve`
- `Rate`

Contraintes :

- largeur importante
- code couleur stable (`vert` / `rouge`)
- disabled si le pari est invalide

## 7.8 `FinalTextPanel`

Affiche le texte public censure.

Doit supporter :

- multi-lignes
- gros interlignage
- mise en evidence des segments censures

## 7.9 `Scoreboard`

Affiche les points de l'equipe A et B avec mise en evidence de l'equipe active ou gagnante.

---

## 8. Gestion des evenements de clic prolonge

## 8.1 Pourquoi `Pointer Events`

Utiliser `Pointer Events` plutot que des listeners distincts souris/tactile permet :

- unifier souris, tactile et stylet
- gerer `pointercancel`
- capturer proprement l'interaction

## 8.2 Pseudo-code de reference

```ts
function useHoldToReveal() {
  const [isPressed, setIsPressed] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  const hide = () => {
    pointerIdRef.current = null;
    setIsPressed(false);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPressed(true);
  };

  const onPointerUp = () => hide();
  const onPointerCancel = () => hide();
  const onPointerLeave = () => hide();
  const onLostPointerCapture = () => hide();

  useEffect(() => {
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hide();
    });
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  return {
    isPressed,
    bind: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onLostPointerCapture,
      onContextMenu: (e: Event) => e.preventDefault(),
    },
  };
}
```

## 8.3 Detail important

Ne pas introduire de delai d'affichage long, sinon `DICO` risque de croire que le controle ne fonctionne pas. Un reveal immediat au `pointerdown` est preferable, avec masquage immediat des que la pression cesse.

---

## 9. Logique de censure du texte final

## 9.1 Regle fonctionnelle

Dans `FINAL_RIDDLE`, le texte public affiche :

- les keywords trouves dans leur forme originale
- les keywords rates remplaces par `[______]`

## 9.2 Risques a couvrir

- majuscules / minuscules
- accents
- ponctuation adjacente
- apostrophes
- repetition eventuelle d'un mot-clef dans le texte
- sous-chaines non desirees, ex. masquer `air` dans `clair` est interdit

## 9.3 Strategie recommandee

Utiliser une tokenisation par mots, pas un simple `replaceAll` brut.

Implementation conseillee :

1. tokeniser `text` avec `Intl.Segmenter(locale, { granularity: "word" })`
2. pour chaque token "word-like", calculer une cle de comparaison normalisee :
   - `toLocaleLowerCase(locale)`
   - normalisation Unicode `NFD`
   - suppression des diacritiques
3. faire la meme normalisation pour les keywords rates
4. remplacer uniquement les tokens complets dont la forme normalisee matche un keyword rate
5. laisser intacts espaces et ponctuation

## 9.4 Pseudo-code

```ts
function normalizeForMatch(value: string, locale: string) {
  return value
    .toLocaleLowerCase(locale)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function censorFinalText(
  text: string,
  failedKeywords: string[],
  locale: string
) {
  const failedSet = new Set(failedKeywords.map((k) => normalizeForMatch(k, locale)));
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  const segments = Array.from(segmenter.segment(text));

  return segments
    .map((segment) => {
      if (!segment.isWordLike) return segment.segment;
      const tokenKey = normalizeForMatch(segment.segment, locale);
      return failedSet.has(tokenKey) ? "[______]" : segment.segment;
    })
    .join("");
}
```

## 9.5 Cas de secours

Si `Intl.Segmenter` n'est pas disponible, fallback acceptable :

- regex Unicode par mots
- comparaison normalisee

Mais `Intl.Segmenter` doit rester la voie principale.

---

## 10. Reducer d'etat recommande

Une SPA de ce type est plus robuste avec un reducer central plutot qu'une accumulation de `useState`.

## 10.1 Actions

```ts
type Action =
  | { type: "START_ROUND" }
  | { type: "SET_BET"; value: number | null }
  | { type: "REVEAL_KEYWORD"; visible: boolean }
  | { type: "RESOLVE_WORD"; success: boolean }
  | { type: "AUTO_FAIL_REMAINING_WORDS" }
  | { type: "REVEAL_ANSWER"; visible: boolean }
  | { type: "RESOLVE_FINAL"; success: boolean }
  | { type: "NEXT_ROUND"; nextEnigma: Enigma };
```

## 10.2 Regles de reducer

- toute action incompatible avec `phase` est ignoree ou jette une erreur de dev
- `RESOLVE_WORD` lit le `currentWordIndex` courant et consomme `currentBet`
- apres `RESOLVE_WORD`
  - si `currentWordIndex < 4`, incrementer l'index
  - sinon passer a `FINAL_RIDDLE`
- `RESOLVE_FINAL` ne fait pas encore tourner l'equipe
- le bonus est applique a l'entree de `ROUND_SUMMARY`, pas au clic utilisateur

---

## 11. Flux d'ecran detaille

## 11.1 Ecran `SETUP`

Structure recommande :

- bandeau scores
- bloc central :
  - `Equipe A joue`
  - `clue`
  - `13 Briques`
- CTA principal

## 11.2 Ecran `WORD_LOOP`

Structure recommande :

- haut public :
  - briques restantes
  - `Mot 2/5`
  - mini score
- bas secret :
  - pari
  - bouton maintien reveal
  - feedback de validation du pari
  - boutons `Trouve` et `Rate`

## 11.3 Ecran `FINAL_RIDDLE`

Structure recommande :

- haut public :
  - texte censure en grand
- bas secret :
  - bouton maintien solution
  - `Enigme resolue`
  - `Echec`

## 11.4 Ecran `ROUND_SUMMARY`

Structure recommande :

- recap manche
- bonus affiche explicitement
- grand tableau de score
- instruction physique `Passer la tablette a l'equipe adverse`

---

## 12. Regles de selection des enigmes

- une enigme ne doit pas etre rejouee dans la meme session
- `usedEnigmaIds` doit etre mis a jour a la creation de manche, pas en fin de manche
- le choix de la prochaine enigme peut etre :
  - aleatoire parmi les non jouees
  - sequentiel dans l'ordre du fichier

Recommandation : choix aleatoire stable en debut de session, avec deck melange une seule fois pour eviter tout biais visible.

---

## 13. Cas limites a gerer explicitement

- JSON vide ou aucune enigme valide
- moins de 2 equipes configurees
- perte de focus navigateur pendant un reveal
- rotation d'ecran mobile
- clavier numerique qui masque trop de contenu
- `bricksRemaining` tombe a `0` avant le mot 5
- keyword absent textuellement du `text`

Pour ce dernier cas :

- ne pas bloquer la partie
- afficher le texte tel quel
- journaliser un warning de donnees

---

## 14. Strategie de tests

## 14.1 Tests unitaires

- normalisation du JSON source
- rejet des cartes invalides
- calcul du score
- bonus de briques
- censure du texte final
- reset automatique des reveals

## 14.2 Tests d'integration

- tour complet sans erreur
- 5 mots trouves puis bonus
- mots rates correctement censures
- solution visible uniquement pendant l'appui
- `NEXT_ROUND` change d'equipe et recharge une enigme

## 14.3 Tests UX manuels

- verifier que `SYNO` assis face a l'ecran ne peut pas lire au simple glance les zones secretes
- verifier que le contenu secret disparait instantanement quand le doigt se leve
- verifier les tailles tactiles sur tablette paysage et portrait

---

## 15. Decisions d'implementation recommandees

- framework front : React avec reducer central
- styling : CSS variables + layout responsive simple, sans surcharge decorative
- gestion de session : etat en memoire, persistance locale optionnelle plus tard
- i18n : conserver une `locale` globale, meme si la V1 cible d'abord `fr`

---

## 16. Resume executable pour le developpeur

Pour implementer la V1 sans ambiguite :

1. charger et normaliser le JSON vers des enigmes a 5 keywords stricts
2. initialiser une session avec 2 equipes, scores a `0`, equipe active `A`
3. lancer chaque manche en `SETUP` avec `13` briques
4. executer 5 iterations `WORD_LOOP` avec pari obligatoire et reveal en maintien
5. afficher ensuite le texte final en censurant les keywords rates
6. permettre a `DICO` de maintenir pour voir la solution
7. scorer l'enigme finale, appliquer le bonus si les 5 mots ont ete trouves
8. afficher le bilan, tourner vers l'equipe adverse, charger l'enigme suivante

Cette specification couvre l'architecture d'interface, la logique d'etat, les interactions sensibles et les regles de score necessaires pour implementer exactement le flux demande.
