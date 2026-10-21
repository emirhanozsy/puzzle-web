import { PuzzleConfig, PuzzlePiece } from './puzzle';

export interface Player {
  id: string;
  nickname: string;
  color: string;
  cursor: { x: number; y: number; active: boolean } | null;
  piecesSolved: number;
  isHost: boolean;
  joinedAt: number;
}

export type NetworkMessageType =
  | 'HELLO'
  | 'HELLO_REJECT'
  | 'HELLO_ACCEPT'
  | 'PLAYERS_UPDATE'
  | 'PLAYER_LEFT'
  | 'CURSOR_MOVE'
  | 'PIECE_GRAB'
  | 'PIECE_MOVE'
  | 'PIECE_RELEASE'
  | 'PIECE_SNAP'
  | 'BOARD_SYNC'
  | 'RESET_PUZZLE'
  | 'CHAT_MESSAGE';

export interface BaseNetworkMessage {
  type: NetworkMessageType;
  senderId: string;
  timestamp: number;
}

export interface HelloMessage extends BaseNetworkMessage {
  type: 'HELLO';
  player: Player;
}

export interface HelloRejectMessage extends BaseNetworkMessage {
  type: 'HELLO_REJECT';
  reason: 'NICKNAME_TAKEN' | 'COLOR_TAKEN' | 'ROOM_FULL';
  message: string;
  targetId?: string; // ID of the player being rejected
}

export interface HelloAcceptMessage extends BaseNetworkMessage {
  type: 'HELLO_ACCEPT';
  players: Player[];
  config: PuzzleConfig;
  pieces: PuzzlePiece[];
}

export interface PlayersUpdateMessage extends BaseNetworkMessage {
  type: 'PLAYERS_UPDATE';
  players: Player[];
}

export interface PlayerLeftMessage extends BaseNetworkMessage {
  type: 'PLAYER_LEFT';
  playerId: string;
}

export interface CursorMoveMessage extends BaseNetworkMessage {
  type: 'CURSOR_MOVE';
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  active: boolean;
}

export interface PieceGrabMessage extends BaseNetworkMessage {
  type: 'PIECE_GRAB';
  pieceId: number;
  nickname: string;
  color: string;
}

export interface PieceMoveMessage extends BaseNetworkMessage {
  type: 'PIECE_MOVE';
  pieceId: number;
  x: number;
  y: number;
}

export interface PieceReleaseMessage extends BaseNetworkMessage {
  type: 'PIECE_RELEASE';
  pieceId: number;
  x: number;
  y: number;
}

export interface PieceSnapMessage extends BaseNetworkMessage {
  type: 'PIECE_SNAP';
  pieceId: number;
  nickname: string;
  color: string;
}

export interface BoardSyncMessage extends BaseNetworkMessage {
  type: 'BOARD_SYNC';
  pieces: PuzzlePiece[];
  config: PuzzleConfig;
}

export interface ResetPuzzleMessage extends BaseNetworkMessage {
  type: 'RESET_PUZZLE';
  pieces: PuzzlePiece[];
}

export type NetworkMessage =
  | HelloMessage
  | HelloRejectMessage
  | HelloAcceptMessage
  | PlayersUpdateMessage
  | PlayerLeftMessage
  | CursorMoveMessage
  | PieceGrabMessage
  | PieceMoveMessage
  | PieceReleaseMessage
  | PieceSnapMessage
  | BoardSyncMessage
  | ResetPuzzleMessage;
