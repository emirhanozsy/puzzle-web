import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PuzzlePiece, PuzzleConfig } from '../types/puzzle';
import { Player } from '../types/network';
import { RemoteCursors } from './RemoteCursors';
import { playClickSound, playSnapSound } from '../utils/audio';

interface PuzzleBoardProps {
  config: PuzzleConfig;
  pieces: PuzzlePiece[];
  players: Player[];
  localPlayer: Player;
  showGhost: boolean;
  onPieceMove: (pieceId: number, x: number, y: number) => void;
  onPieceGrab: (pieceId: number) => void;
  onPieceRelease: (pieceId: number, x: number, y: number) => void;
  onPieceSnap: (pieceId: number) => void;
  onCursorMove: (x: number, y: number, active: boolean) => void;
  boardWidth: number;
  boardHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  config,
  pieces,
  players,
  localPlayer,
  showGhost,
  onPieceMove,
  onPieceGrab,
  onPieceRelease,
  onPieceSnap,
  onCursorMove,
  boardWidth,
  boardHeight,
  containerWidth,
  containerHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDraggingPieceId, setActiveDraggingPieceId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [highestZIndex, setHighestZIndex] = useState<number>(pieces.length + 10);

  // Map of which player is dragging which piece (for cursor status indicator)
  const draggingPiecesMap: Record<string, number> = {};
  pieces.forEach((p) => {
    if (p.beingDraggedBy) {
      draggingPiecesMap[p.beingDraggedBy.playerId] = p.id;
    }
  });

  // Calculate board offset within the workspace container
  const boardLeft = Math.max(0, (containerWidth - boardWidth) / 2);
  const boardTop = Math.max(0, (containerHeight - boardHeight) / 2);

  const pieceWidth = boardWidth / config.cols;
  const pieceHeight = boardHeight / config.rows;
  const tabSize = Math.max(pieceWidth, pieceHeight) * 0.25;

  // Track and broadcast local cursor position
  const handlePointerMoveContainer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    onCursorMove(
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y)),
      true
    );

    // If currently dragging a piece
    if (activeDraggingPieceId !== null) {
      const piece = pieces.find((p) => p.id === activeDraggingPieceId);
      if (piece && !piece.isLocked) {
        // Calculate new piece position relative to container
        let newX = e.clientX - rect.left - dragOffset.x;
        let newY = e.clientY - rect.top - dragOffset.y;

        // Clamp within container
        const maxPieceX = Math.max(0, containerWidth - (piece.width || 50));
        const maxPieceY = Math.max(0, containerHeight - (piece.height || 50) - 60);
        newX = Math.max(0, Math.min(maxPieceX, newX));
        newY = Math.max(0, Math.min(maxPieceY, newY));

        onPieceMove(activeDraggingPieceId, Math.round(newX), Math.round(newY));
      }
    }
  }, [activeDraggingPieceId, dragOffset, onCursorMove, onPieceMove, pieces, containerWidth, containerHeight]);

  const handlePointerLeaveContainer = () => {
    onCursorMove(0, 0, false);
  };

  // Start dragging a piece
  const handlePiecePointerDown = (e: React.PointerEvent, piece: PuzzlePiece) => {
    if (piece.isLocked) return;
    // Don't drag if another player is currently holding it
    if (piece.beingDraggedBy && piece.beingDraggedBy.playerId !== localPlayer.id) return;

    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setActiveDraggingPieceId(piece.id);
    setDragOffset({
      x: clickX - piece.currentX,
      y: clickY - piece.currentY,
    });

    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    piece.zIndex = newZ;

    playClickSound();
    onPieceGrab(piece.id);

    // Capture pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Release / Drop a piece
  const handlePiecePointerUp = (e: React.PointerEvent, piece: PuzzlePiece) => {
    if (activeDraggingPieceId !== piece.id) return;

    setActiveDraggingPieceId(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }

    // Check snap distance to correct board position
    // Target position in container coordinates:
    const correctContainerX = boardLeft + piece.targetX;
    const correctContainerY = boardTop + piece.targetY;

    // More generous snap distance on touch/mobile
    const snapDistanceThreshold = Math.max(32, pieceWidth * 0.42);
    const dist = Math.hypot(
      piece.currentX - correctContainerX,
      piece.currentY - correctContainerY
    );

    if (dist <= snapDistanceThreshold) {
      // Snap to exact correct place!
      playSnapSound();
      onPieceSnap(piece.id);
    } else {
      // Keep dropped position
      onPieceRelease(piece.id, piece.currentX, piece.currentY);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMoveContainer}
      onPointerLeave={handlePointerLeaveContainer}
      className="relative w-full h-full min-h-[300px] max-w-full max-h-full bg-slate-100/70 select-none overflow-hidden touch-none flex items-center justify-center shadow-inner"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {/* Remote live cursors overlay */}
      <RemoteCursors
        players={players}
        localPlayerId={localPlayer.id}
        boardWidth={containerWidth}
        boardHeight={containerHeight}
        draggingPiecesMap={draggingPiecesMap}
      />

      {/* Center Target Board Frame */}
      <div
        className="absolute rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 shadow-lg overflow-hidden transition-all duration-300"
        style={{
          left: boardLeft,
          top: boardTop,
          width: boardWidth,
          height: boardHeight,
        }}
      >
        {/* Ghost Hint Image (if enabled) */}
        {showGhost && (
          <img
            src={config.imageUrl}
            alt="Ghost Preview"
            className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none transition-opacity duration-300"
          />
        )}

        {/* Piece Grid Slot Guidelines */}
        <div
          className="absolute inset-0 grid pointer-events-none opacity-20"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: config.totalPieces }).map((_, i) => (
            <div key={i} className="border border-slate-500/30" />
          ))}
        </div>
      </div>

      {/* Render All Puzzle Pieces */}
      {pieces.map((piece) => {
        const isDragging = activeDraggingPieceId === piece.id;
        const isBeingDraggedByOther =
          piece.beingDraggedBy && piece.beingDraggedBy.playerId !== localPlayer.id;

        // Container coordinates
        const posX = piece.isLocked
          ? boardLeft + piece.targetX - tabSize
          : piece.currentX - tabSize;
        const posY = piece.isLocked
          ? boardTop + piece.targetY - tabSize
          : piece.currentY - tabSize;

        const cw = Math.ceil(pieceWidth + tabSize * 2);
        const ch = Math.ceil(pieceHeight + tabSize * 2);

        return (
          <div
            key={piece.id}
            onPointerDown={(e) => handlePiecePointerDown(e, piece)}
            onPointerUp={(e) => handlePiecePointerUp(e, piece)}
            onPointerCancel={(e) => handlePiecePointerUp(e, piece)}
            style={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`,
              width: `${cw}px`,
              height: `${ch}px`,
              zIndex: isDragging ? 9999 : piece.isLocked ? 5 : piece.zIndex,
              cursor: piece.isLocked
                ? 'default'
                : isBeingDraggedByOther
                ? 'not-allowed'
                : isDragging
                ? 'grabbing'
                : 'grab',
              transform: isDragging ? 'scale(1.05)' : 'scale(1)',
              filter: isDragging
                ? 'drop-shadow(0 14px 20px rgba(0,0,0,0.3))'
                : piece.isLocked
                ? 'none'
                : 'drop-shadow(0 3px 5px rgba(0,0,0,0.15))',
              transition: isDragging
                ? 'transform 0.1s ease-out'
                : 'transform 0.2s ease, filter 0.2s ease',
              touchAction: 'none',
            }}
            className="will-change-transform"
          >
            {/* Piece Image Bitmap */}
            {piece.dataUrl ? (
              <img
                src={piece.dataUrl}
                alt={`Piece ${piece.id}`}
                className="w-full h-full pointer-events-none select-none block"
                draggable={false}
              />
            ) : null}

            {/* Indicator if remote player is dragging it */}
            {isBeingDraggedByOther && piece.beingDraggedBy && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1 pointer-events-none whitespace-nowrap animate-pulse"
                style={{ backgroundColor: piece.beingDraggedBy.color }}
              >
                <span>{piece.beingDraggedBy.nickname}</span>
              </div>
            )}

            {/* Solved Indicator Tag for 1.5s after snap */}
            {piece.isLocked && piece.lockedByNickname && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full opacity-0 pointer-events-none"
                style={{ backgroundColor: piece.lockedByColor }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
