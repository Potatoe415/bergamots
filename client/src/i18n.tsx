import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'fr';

type Vars = Record<string, string | number>;

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

const en: Record<string, string> = {
  // Lobby
  'lobby.subtitle': 'A cooperative island-finding voyage',
  'lobby.players': '2 players',
  'lobby.cooperative': 'Cooperative',
  'lobby.duration': '~20 min',
  'lobby.local': '🎮 Local (Pass & Play)',
  'lobby.createOnline': '🌐 Create Online Room',
  'lobby.joinOnline': '🔗 Join Online Room',
  'lobby.localGame': 'Local Game',
  'lobby.player1Name': 'Player 1 name',
  'lobby.player2Name': 'Player 2 name',
  'lobby.startGame': 'Start Game',
  'lobby.back': '← Back',
  'lobby.createRoom': 'Create Room',
  'lobby.yourName': 'Your name',
  'lobby.connecting': 'Connecting…',
  'lobby.shareCode': 'Share this code with your partner:',
  'lobby.waitingPartner': 'Waiting for them to join…',
  'lobby.joinRoom': 'Join Room',
  'lobby.roomCode': 'Room code',
  'lobby.joining': 'Joining…',
  'lobby.join': 'Join',
  'lobby.captainPlaceholder': 'Captain…',
  'lobby.sailorPlaceholder': 'Sailor…',
  'lobby.cancelRoom': '✕ Cancel',
  // GameBoard
  'game.hand': 'Hand',
  'game.deck': 'Deck',
  'game.you': '(you)',
  'game.deselect': '✕ Deselect',
  'game.discard2': '🗑️ Discard 2',
  'game.selectDiscard': 'Select 2 cards to discard ({count}/2)',
  'game.cancel': 'Cancel',
  'game.confirmDiscard': 'Confirm Discard',
  'game.backToMenu': 'Back to menu',
  // GameOver
  'gameover.won': 'Paradise Found!',
  'gameover.lost': 'The Ship is Lost',
  'gameover.wonMsg': 'Congratulations! You navigated the seas together and found your island paradise.',
  'gameover.lostMsg': "A player couldn't take a legal action and the voyage ended.",
  'gameover.playAgain': '🔄 Play Again',
  'gameover.menu': '🏠 Menu',
  // PassAndPlayTransition
  'transition.title': 'Pass the device',
  'transition.turn': "It's {name}'s turn",
  'transition.hint': 'Hide the screen from your partner before tapping Ready.',
  'transition.ready': "I'm ready 🏝️",
  // DiscardModal
  'discard.title': 'Discard to Pay',
  'discard.placing': 'Placing',
  'discard.requiresDiscard': 'requires discarding',
  'discard.card': 'card',
  'discard.cards': 'cards',
  'discard.selected': '{sel} / {req} selected',
  'discard.cancel': 'Cancel',
  'discard.confirm': 'Confirm',
  // StartDiscardModal
  'startDiscard.title': 'Start Card Played!',
  'startDiscard.waiting': 'Waiting for your partner to contribute their discards…',
  'startDiscard.theirContrib': 'Their contribution',
  'startDiscard.stillNeeded': 'Still needed',
  'startDiscard.together': 'Together you must discard 8 cards. Your partner contributed {n}.',
  'startDiscard.selectUp': 'Select up to {max} cards to contribute ({remaining} still needed).',
  'startDiscard.contributing': 'Contributing {sel} / {max} max',
  'startDiscard.contributeBtn': 'Contribute {n} {card}',
  // App
  'app.waitingPartner': 'Room {code} — waiting for partner…',
  'app.connecting': 'Connecting…',
  'app.kicked': 'You were replaced by another player.',
};

const fr: Record<string, string> = {
  // Lobby
  'lobby.subtitle': 'Un voyage coopératif à la recherche d\'une île',
  'lobby.players': '2 joueurs',
  'lobby.cooperative': 'Coopératif',
  'lobby.duration': '~20 min',
  'lobby.local': '🎮 Local (Passez & Jouez)',
  'lobby.createOnline': '🌐 Créer une salle en ligne',
  'lobby.joinOnline': '🔗 Rejoindre une salle',
  'lobby.localGame': 'Partie locale',
  'lobby.player1Name': 'Nom du joueur 1',
  'lobby.player2Name': 'Nom du joueur 2',
  'lobby.startGame': 'Démarrer',
  'lobby.back': '← Retour',
  'lobby.createRoom': 'Créer la salle',
  'lobby.yourName': 'Votre nom',
  'lobby.connecting': 'Connexion…',
  'lobby.shareCode': 'Partagez ce code avec votre partenaire :',
  'lobby.waitingPartner': 'En attente de leur connexion…',
  'lobby.joinRoom': 'Rejoindre',
  'lobby.roomCode': 'Code de salle',
  'lobby.joining': 'Connexion…',
  'lobby.join': 'Rejoindre',
  'lobby.captainPlaceholder': 'Capitaine…',
  'lobby.sailorPlaceholder': 'Marin…',
  'lobby.cancelRoom': '✕ Annuler',
  // GameBoard
  'game.hand': 'Main',
  'game.deck': 'Pioche',
  'game.you': '(vous)',
  'game.deselect': '✕ Désélectionner',
  'game.discard2': '🗑️ Défausser 2',
  'game.selectDiscard': 'Choisissez 2 cartes à défausser ({count}/2)',
  'game.cancel': 'Annuler',
  'game.confirmDiscard': 'Confirmer la défausse',
  'game.backToMenu': 'Retour au menu',
  // GameOver
  'gameover.won': 'Paradis trouvé !',
  'gameover.lost': 'Le bateau est perdu',
  'gameover.wonMsg': 'Félicitations ! Vous avez navigué ensemble et trouvé votre île paradisiaque.',
  'gameover.lostMsg': 'Un joueur ne pouvait plus jouer et le voyage s\'est terminé.',
  'gameover.playAgain': '🔄 Rejouer',
  'gameover.menu': '🏠 Menu',
  // PassAndPlayTransition
  'transition.title': 'Passez l\'appareil',
  'transition.turn': 'C\'est au tour de {name}',
  'transition.hint': 'Cachez l\'écran de votre partenaire avant d\'appuyer sur Prêt.',
  'transition.ready': 'Je suis prêt 🏝️',
  // DiscardModal
  'discard.title': 'Défausser pour payer',
  'discard.placing': 'Poser',
  'discard.requiresDiscard': 'nécessite de défausser',
  'discard.card': 'carte',
  'discard.cards': 'cartes',
  'discard.selected': '{sel} / {req} sélectionnée(s)',
  'discard.cancel': 'Annuler',
  'discard.confirm': 'Confirmer',
  // StartDiscardModal
  'startDiscard.title': 'Carte de départ jouée !',
  'startDiscard.waiting': 'En attente de la contribution de votre partenaire…',
  'startDiscard.theirContrib': 'Sa contribution',
  'startDiscard.stillNeeded': 'Encore nécessaire',
  'startDiscard.together': 'Ensemble vous devez défausser 8 cartes. Votre partenaire en a contribué {n}.',
  'startDiscard.selectUp': 'Choisissez jusqu\'à {max} cartes à contribuer ({remaining} encore nécessaires).',
  'startDiscard.contributing': 'Contribution : {sel} / {max} max',
  'startDiscard.contributeBtn': 'Contribuer {n} {card}',
  // App
  'app.waitingPartner': 'Salle {code} — en attente d\'un partenaire…',
  'app.connecting': 'Connexion…',
  'app.kicked': 'Vous avez été remplacé(e) par un autre joueur.',
};

const translations: Record<Lang, Record<string, string>> = { en, fr };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const Context = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  function t(key: string, vars?: Vars): string {
    const str = translations[lang][key] ?? translations['en'][key] ?? key;
    return interpolate(str, vars);
  }

  return <Context.Provider value={{ lang, setLang, t }}>{children}</Context.Provider>;
}

export function useT() {
  return useContext(Context).t;
}

export function useLang() {
  const { lang, setLang } = useContext(Context);
  return { lang, setLang };
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-wide">
      <button
        className={`px-1.5 py-0.5 transition-colors ${lang === 'en' ? 'text-white' : 'text-ocean-500 hover:text-ocean-300'}`}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <span className="text-ocean-700">|</span>
      <button
        className={`px-1.5 py-0.5 transition-colors ${lang === 'fr' ? 'text-white' : 'text-ocean-500 hover:text-ocean-300'}`}
        onClick={() => setLang('fr')}
      >
        FR
      </button>
    </div>
  );
}
