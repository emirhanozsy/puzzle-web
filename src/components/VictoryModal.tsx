import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Puzzle, Sparkles, RotateCcw, PlusCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Player } from '../types/network';
import { playVictorySound } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  timeElapsed: number;
  totalPieces: number;
  players: Player[];
  onRestart: () => void;
  onNewPuzzle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeElapsed,
  totalPieces,
  players,
  onRestart,
  onNewPuzzle,
}) => {
  useEffect(() => {
    if (isOpen) {
      playVictorySound();

      // Trigger spectacular confetti cannon
      const end = Date.now() + 3000;
      const colors = ['#f43f6e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeFormatted = `${minutes > 0 ? `${minutes} dk ` : ''}${seconds} sn`;

  // Sort players by pieces solved
  const sortedPlayers = [...players].sort((a, b) => b.piecesSolved - a.piecesSolved);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 sm:gap-6 text-center relative my-auto">
        {/* Top Celebration Ribbon */}
        <div className="absolute top-0 inset-x-0 h-2.5 sm:h-3 bg-gradient-to-r from-watermelon-500 via-yellow-400 to-mint-500" />

        <div className="pt-2 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-lg mb-2 sm:mb-3 animate-bounce-subtle">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Harika İş, Tamamlandı! 🎉
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Puzzle'ın tüm parçaları başarıyla birleştirildi!
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center">
            <Clock className="w-5 h-5 text-watermelon-500 mb-1" />
            <span className="text-xs font-bold text-slate-500 uppercase">Geçen Süre</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5">{timeFormatted}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center">
            <Puzzle className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs font-bold text-slate-500 uppercase">Toplam Parça</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5">{totalPieces} Parça</span>
          </div>
        </div>

        {/* Player Contributions Leaderboard */}
        <div className="flex flex-col gap-2 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Oyuncu Katkıları:
          </span>
          <div className="bg-slate-50 rounded-2xl p-2.5 flex flex-col gap-1.5 border border-slate-100 max-h-40 overflow-y-auto">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-slate-400 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-sm font-bold text-slate-800">{player.nickname}</span>
                </div>
                <div className="text-xs font-bold text-slate-600">
                  <span className="text-watermelon-600 font-extrabold">{player.piecesSolved}</span> parça
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
            icon={<RotateCcw className="w-4 h-4" />}
            className="flex-1"
          >
            Yeniden Karıştır
          </Button>
          <Button
            variant="watermelon"
            size="lg"
            onClick={onNewPuzzle}
            icon={<PlusCircle className="w-4 h-4" />}
            className="flex-1 shadow-lg"
          >
            Yeni Puzzle Seç
          </Button>
        </div>
      </div>
    </div>
  );
};
