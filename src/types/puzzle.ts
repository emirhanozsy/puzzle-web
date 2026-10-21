export interface PieceEdges {
  top: number;    // 0: flat border, 1: tab (out), -1: blank (in)
  right: number;  // 0: flat border, 1: tab (out), -1: blank (in)
  bottom: number; // 0: flat border, 1: tab (out), -1: blank (in)
  left: number;   // 0: flat border, 1: tab (out), -1: blank (in)
}

export interface DraggedInfo {
  playerId: string;
  nickname: string;
  color: string;
}

export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  isLocked: boolean;
  lockedByNickname?: string;
  lockedByColor?: string;
  beingDraggedBy?: DraggedInfo | null;
  edges: PieceEdges;
  dataUrl?: string; // Cache rendered piece image with tabs
  zIndex: number;
}

export interface PuzzleConfig {
  id: string;
  title: string;
  artistOrLocation?: string;
  imageUrl: string;
  rows: number;
  cols: number;
  totalPieces: number;
}

export interface PresetImage {
  id: string;
  title: string;
  artistOrLocation: string;
  category: 'art' | 'landscape';
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
}
