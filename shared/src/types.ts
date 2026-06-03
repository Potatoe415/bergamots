export type CardType = 'island' | 'start' | 'finish' | 'monster';

export interface Card {
  id: string;
  type: CardType;
  value: number | null; // null for start / finish / monster
}

export interface GridCell {
  position: number; // 0–35, reading order: bottom-left → top-right
  card: Card | null;
}

export type GamePhase = 'waiting' | 'playing' | 'start_discard' | 'finish_pending' | 'won' | 'lost';

export type MonsterCount = 0 | 3 | 4 | 5;

export interface StartDiscardState {
  remaining: number;
  contributions: [number, number];
  currentContributor: 0 | 1;
}

// Full server-side state — never sent to clients as-is
export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  deck: Card[];
  discardCount: number;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  grid: GridCell[];
  players: [PlayerState, PlayerState];
  currentPlayerIndex: 0 | 1;
  startCardPlayed: boolean;
  startDiscardState: StartDiscardState | null;
  monsterCount: MonsterCount;
  winner: 'players' | 'game' | null;
}

// ── Sanitised client payload ──────────────────────────────────────────────────

export interface ClientPlayerView {
  id: string;
  name: string;
  handSize: number;
  deckSize: number;
  discardCount: number;
  isCurrentPlayer: boolean;
}

export interface ClientStartDiscardState {
  remaining: number;
  myContribution: number;
  opponentContribution: number;
  isMyTurnToContribute: boolean;
}

export interface LegalMove {
  cardId: string;
  position: number; // -1 = start/finish special action; 0–35 = grid
  discardCost: number;
}

export interface ClientGameState {
  roomId: string;
  phase: GamePhase;
  grid: GridCell[];
  myHand: Card[];
  myPlayerIndex: 0 | 1;
  players: [ClientPlayerView, ClientPlayerView];
  currentPlayerIndex: 0 | 1;
  startCardPlayed: boolean;
  startDiscardState: ClientStartDiscardState | null;
  legalMoves: LegalMove[];
  canDiscardTwo: boolean;
  monsterCount: MonsterCount;
  winner: 'players' | 'game' | null;
  message: string;
}

// ── Socket event payloads ─────────────────────────────────────────────────────

export interface JoinGamePayload {
  roomId?: string;
  playerName?: string;
  sessionToken?: string;
  monsterCount?: MonsterCount; // only used by room creator
}

export interface PlayCardPayload {
  cardId: string;
  position: number;
  discardCardIds: string[];
}

export interface DiscardTwoPayload {
  cardIds: [string, string];
}

export interface ContributeStartDiscardPayload {
  cardIds: string[];
}

// Server → Client
export interface GameJoinedPayload {
  sessionToken: string;
  playerIndex: 0 | 1;
  roomId: string;
  gameState: ClientGameState;
}

export interface WaitingPayload {
  roomId: string;
  message: string;
}

export interface ErrorPayload {
  message: string;
}

export interface KickedPayload {
  message: string;
}
