import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  GameState,
  JoinGamePayload,
  PlayCardPayload,
  DiscardTwoPayload,
  ContributeStartDiscardPayload,
  GameJoinedPayload,
  WaitingPayload,
  ErrorPayload,
  MonsterCount,
} from '@tranquillity/shared';
import {
  initializeGame,
  buildClientState,
  applyPlayCard,
  applyDiscardTwo,
  applyContributeStartDiscard,
  generateId,
} from '@tranquillity/shared';

// ── Room management ───────────────────────────────────────────────────────────

interface ConnectedPlayer {
  socketId: string;
  sessionToken: string;
  playerIndex: 0 | 1;
  name: string;
  connected: boolean;
}

interface Room {
  id: string;
  players: ConnectedPlayer[];
  gameState: GameState | null;
  monsterCount: MonsterCount;
}

const rooms = new Map<string, Room>();
const tokenToRoom = new Map<string, string>();   // token  → roomId
const tokenToIndex = new Map<string, 0 | 1>();   // token  → playerIndex
const socketToToken = new Map<string, string>();  // sockId → token

function createRoom(monsterCount: MonsterCount = 0): Room {
  const id = generateId(3);
  const room: Room = { id, players: [], gameState: null, monsterCount };
  rooms.set(id, room);
  return room;
}

function emitGameState(io: Server, room: Room) {
  if (!room.gameState) return;
  for (const p of room.players) {
    if (!p.connected) continue;
    const payload = buildClientState(room.gameState, p.playerIndex);
    io.to(p.socketId).emit('game_state', payload);
  }
}

function emitError(socket: Socket, message: string) {
  const payload: ErrorPayload = { message };
  socket.emit('error', payload);
}

// ── Server bootstrap ──────────────────────────────────────────────────────────

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── join_game ──────────────────────────────────────────────────────────────
  socket.on('join_game', (payload: JoinGamePayload) => {
    const name = payload.playerName?.trim() || 'Player';

    // Reconnection attempt
    if (payload.sessionToken) {
      const roomId = tokenToRoom.get(payload.sessionToken);
      const idx = tokenToIndex.get(payload.sessionToken);
      if (roomId && idx !== undefined) {
        const room = rooms.get(roomId);
        if (room) {
          const existing = room.players.find(p => p.sessionToken === payload.sessionToken);
          if (existing) {
            existing.socketId = socket.id;
            existing.connected = true;
            socketToToken.set(socket.id, payload.sessionToken);
            socket.join(roomId);
            console.log(`[reconnect] ${name} to room ${roomId} as player ${idx}`);

            if (room.gameState) {
              const joined: GameJoinedPayload = {
                sessionToken: payload.sessionToken,
                playerIndex: idx,
                roomId,
                gameState: buildClientState(room.gameState, idx),
              };
              socket.emit('game_joined', joined);
            } else {
              // Game not started yet — tell the client to keep waiting
              const waiting: WaitingPayload = { roomId, message: `Room code: ${roomId} — waiting for second player…` };
              socket.emit('waiting', waiting);
            }
            return;
          }
        }
      }
    }

    // Join existing room
    let room: Room | undefined;
    if (payload.roomId) {
      room = rooms.get(payload.roomId.toUpperCase());
      if (!room) { emitError(socket, `Room "${payload.roomId}" not found`); return; }
      if (room.players.length >= 2) { emitError(socket, 'Room is full'); return; }
      if (room.players.length === 0) { emitError(socket, 'Room has no host'); return; }
    } else {
      // Create new room — creator sets monster count
      const mc = ([0, 3, 4, 5] as MonsterCount[]).includes(payload.monsterCount as MonsterCount)
        ? (payload.monsterCount as MonsterCount)
        : 0;
      room = createRoom(mc);
    }

    const sessionToken = generateId(16);
    const playerIndex: 0 | 1 = room.players.length === 0 ? 0 : 1;

    const player: ConnectedPlayer = {
      socketId: socket.id,
      sessionToken,
      playerIndex,
      name,
      connected: true,
    };
    room.players.push(player);
    tokenToRoom.set(sessionToken, room.id);
    tokenToIndex.set(sessionToken, playerIndex);
    socketToToken.set(socket.id, sessionToken);
    socket.join(room.id);

    console.log(`[join] ${name} → room ${room.id} as player ${playerIndex}`);

    if (room.players.length === 1) {
      const waiting: WaitingPayload = { roomId: room.id, message: `Waiting for second player. Room code: ${room.id}` };
      socket.emit('waiting', waiting);
      const joined: GameJoinedPayload = {
        sessionToken,
        playerIndex,
        roomId: room.id,
        gameState: {
          roomId: room.id,
          phase: 'waiting',
          grid: Array.from({ length: 36 }, (_, i) => ({ position: i, card: null })),
          myHand: [],
          myPlayerIndex: 0,
          players: [
            { id: player.socketId, name, handSize: 0, deckSize: 0, discardCount: 0, isCurrentPlayer: false },
            { id: '', name: '…', handSize: 0, deckSize: 0, discardCount: 0, isCurrentPlayer: false },
          ],
          currentPlayerIndex: 0,
          startCardPlayed: false,
          startDiscardState: null,
          legalMoves: [],
          canDiscardTwo: false,
          monsterCount: room.monsterCount,
          winner: null,
          message: `Room code: ${room.id} — waiting for second player…`,
        },
      };
      socket.emit('game_joined', joined);
      return;
    }

    // Two players ready — start game
    const p0 = room.players[0];
    const p1 = room.players[1];
    room.gameState = initializeGame(room.id, { id: p0.sessionToken, name: p0.name }, { id: p1.sessionToken, name: p1.name }, room.monsterCount);

    const joined: GameJoinedPayload = {
      sessionToken,
      playerIndex,
      roomId: room.id,
      gameState: buildClientState(room.gameState, playerIndex),
    };
    socket.emit('game_joined', joined);

    // Also update player 0 with fresh game state
    const p0Socket = io.sockets.sockets.get(p0.socketId);
    if (p0Socket) {
      const p0Joined: GameJoinedPayload = {
        sessionToken: p0.sessionToken,
        playerIndex: 0,
        roomId: room.id,
        gameState: buildClientState(room.gameState, 0),
      };
      p0Socket.emit('game_joined', p0Joined);
    }

    console.log(`[start] Room ${room.id} game started`);
  });

  // ── play_card ──────────────────────────────────────────────────────────────
  socket.on('play_card', (payload: PlayCardPayload) => {
    const token = socketToToken.get(socket.id);
    if (!token) { emitError(socket, 'Not in a game'); return; }
    const roomId = tokenToRoom.get(token);
    if (!roomId) { emitError(socket, 'Not in a game'); return; }
    const room = rooms.get(roomId);
    if (!room?.gameState) { emitError(socket, 'Game not started'); return; }
    const playerIndex = tokenToIndex.get(token)!;

    const result = applyPlayCard(
      room.gameState,
      playerIndex,
      payload.cardId,
      payload.position,
      payload.discardCardIds ?? []
    );

    if (!result.ok) { emitError(socket, result.error); return; }
    room.gameState = result.state;
    emitGameState(io, room);
  });

  // ── discard_two ────────────────────────────────────────────────────────────
  socket.on('discard_two', (payload: DiscardTwoPayload) => {
    const token = socketToToken.get(socket.id);
    if (!token) { emitError(socket, 'Not in a game'); return; }
    const roomId = tokenToRoom.get(token);
    if (!roomId) { emitError(socket, 'Not in a game'); return; }
    const room = rooms.get(roomId);
    if (!room?.gameState) { emitError(socket, 'Game not started'); return; }
    const playerIndex = tokenToIndex.get(token)!;

    const result = applyDiscardTwo(room.gameState, playerIndex, payload.cardIds);
    if (!result.ok) { emitError(socket, result.error); return; }
    room.gameState = result.state;
    emitGameState(io, room);
  });

  // ── contribute_start_discard ───────────────────────────────────────────────
  socket.on('contribute_start_discard', (payload: ContributeStartDiscardPayload) => {
    const token = socketToToken.get(socket.id);
    if (!token) { emitError(socket, 'Not in a game'); return; }
    const roomId = tokenToRoom.get(token);
    if (!roomId) { emitError(socket, 'Not in a game'); return; }
    const room = rooms.get(roomId);
    if (!room?.gameState) { emitError(socket, 'Game not started'); return; }
    const playerIndex = tokenToIndex.get(token)!;

    const result = applyContributeStartDiscard(room.gameState, playerIndex, payload.cardIds);
    if (!result.ok) { emitError(socket, result.error); return; }
    room.gameState = result.state;
    emitGameState(io, room);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const token = socketToToken.get(socket.id);
    if (!token) return;
    const roomId = tokenToRoom.get(token);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.connected = false;
      console.log(`[disconnect] ${player.name} disconnected from room ${roomId} (state preserved)`);
    }
    socketToToken.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Tranquillity server running on http://localhost:${PORT}`);
});
