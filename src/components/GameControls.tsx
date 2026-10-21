import React from 'react';
import { Eye, EyeOff, LayoutGrid, RotateCcw, Clock, Puzzle } from 'lucide-react';
import { Button } from './ui/Button';

interface GameControlsProps {
  piecesSolved: number;
  totalPieces: number;
  timerSeconds: number;
  showGhost: boolean;
  onToggleGhost: () => void;
  onArrangePieces: () => void;
  onResetPuzzle: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  piecesSolved,
  totalPieces,
  timerSeconds,
  showGhost,
  onToggleGhost,
  onArrangePieces,
  onResetPuzzle,
}) => {
  const percent = totalPieces > 0 ? Math.round((piecesSolved / totalPieces) * 100) : 0;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-2 sm:bottom-4 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="glass-panel rounded-2xl p-2 sm:px-4 sm:py-3 shadow-xl border border-slate-200/80 flex items-center justify-between sm:justify-center gap-2 sm:gap-6 max-w-2xl mx-auto">
        {/* Progress & Count */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-watermelon-50 text-watermelon-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            <Puzzle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-800">
              <span>{piecesSolved}/{totalPieces}</span>
              <span className="text-watermelon-600 font-extrabold">%{percent}</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-16 sm:w-32 h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden mt-0.5 sm:mt-1 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-watermelon-500 to-mint-500 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-[11px] sm:text-xs font-mono font-extrabold border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <span>{timeFormatted}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Toggle Ghost / Hint Image */}
          <button
            onClick={onToggleGhost}
            className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              showGhost
                ? 'bg-watermelon-500 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="Arka planda soluk ipucu görselini aç/kapat"
          >
            {showGhost ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden md:inline">İpucu</span>
          </button>

          {/* Arrange / Scatter to sides */}
          <button
            onClick={onArrangePieces}
            className="p-1.5 sm:p-2 rounded-xl text-xs font-bold flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
            title="Dağınık parçaları masanın kenarlarına toparla"
          >
            <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="hidden md:inline">Kenarlara Topla</span>
          </button>

          {/* Reset Puzzle */}
          <button
            onClick={onResetPuzzle}
            className="p-1.5 sm:p-2 rounded-xl text-xs font-bold flex items-center gap-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-all"
            title="Parçaları baştan karıştır"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 hover:text-rose-600" />
            <span className="hidden md:inline">Karıştır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
