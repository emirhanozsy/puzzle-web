import React from 'react';
import { Player } from '../types/network';

interface RemoteCursorsProps {
  players: Player[];
  localPlayerId: string;
  boardWidth: number;
  boardHeight: number;
  draggingPiecesMap?: Record<string, number>; // playerId -> pieceId
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({
  players,
  localPlayerId,
  boardWidth,
  boardHeight,
  draggingPiecesMap = {},
}) => {
  const remotePlayers = players.filter((p) => p.id !== localPlayerId && p.cursor && p.cursor.active);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {remotePlayers.map((player) => {
        if (!player.cursor) return null;

        const posX = player.cursor.x * boardWidth;
        const posY = player.cursor.y * boardHeight;
        const isDragging = draggingPiecesMap[player.id] !== undefined;

        return (
          <div
            key={player.id}
            className="absolute top-0 left-0 transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translate3d(${posX}px, ${posY}px, 0)`,
            }}
          >
            {/* Custom SVG Pointer */}
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={player.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>

            {/* Nickname & Action Badge */}
            <div
              className="absolute left-4 top-2 px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-md flex items-center gap-1 whitespace-nowrap animate-fade-in"
              style={{ backgroundColor: player.color }}
            >
              <span>{player.nickname}</span>
              {isDragging && (
                <span className="text-[9px] bg-black/20 px-1 rounded-full uppercase tracking-tighter">
                  🖐️ Taşıyor
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
