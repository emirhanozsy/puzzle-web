import React, { useState, useEffect } from 'react';
import { PLAYER_COLORS, isNicknameTaken, isColorTaken } from '../utils/colors';
import { Button } from './ui/Button';
import { User, Palette, AlertTriangle, Sparkles } from 'lucide-react';
import { playConflictSound } from '../utils/audio';

interface PlayerModalProps {
  isOpen: boolean;
  initialNickname?: string;
  initialColor?: string;
  existingPlayers?: Array<{ nickname: string; color: string; id: string }>;
  currentUserId?: string;
  roomCode?: string;
  conflictError?: string | null;
  onSave: (nickname: string, color: string) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  initialNickname = '',
  initialColor = PLAYER_COLORS[0].hex,
  existingPlayers = [],
  currentUserId = '',
  roomCode,
  conflictError = null,
  onSave,
}) => {
  const [nickname, setNickname] = useState(initialNickname || '');
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [errorMessage, setErrorMessage] = useState<string | null>(conflictError);

  // Filter out current player when checking conflicts
  const otherPlayers = existingPlayers.filter(p => p.id !== currentUserId);
  const takenNicknames = otherPlayers.map(p => p.nickname);
  const takenColors = otherPlayers.map(p => p.color);

  // Pick an untaken color if initial is taken
  useEffect(() => {
    if (takenColors.includes(selectedColor)) {
      const freeColor = PLAYER_COLORS.find(c => !takenColors.includes(c.hex));
      if (freeColor) {
        setSelectedColor(freeColor.hex);
      }
    }
  }, [existingPlayers]);

  useEffect(() => {
    if (conflictError) {
      setErrorMessage(conflictError);
      playConflictSound();
    }
  }, [conflictError]);

  if (!isOpen) return null;

  const nickTaken = isNicknameTaken(nickname, takenNicknames);
  const colorTaken = isColorTaken(selectedColor, takenColors);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setErrorMessage('Lütfen bir takma ad (nickname) girin.');
      playConflictSound();
      return;
    }

    if (nickTaken) {
      setErrorMessage(`"${cleanNick}" takma adı bu odada başka bir oyuncu tarafından kullanılıyor! Lütfen farklı bir isim seçin.`);
      playConflictSound();
      return;
    }

    if (colorTaken) {
      setErrorMessage('Seçtiğiniz renk bu odada başka bir oyuncu tarafından kullanılıyor! Lütfen başka bir renk seçin.');
      playConflictSound();
      return;
    }

    setErrorMessage(null);
    onSave(cleanNick, selectedColor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-4 sm:gap-6 relative">
        {/* Decorative Top Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-2.5 sm:h-3 transition-colors duration-300"
          style={{ backgroundColor: selectedColor }}
        />

        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-watermelon-500 mb-3 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Oyuncu Profilinizi Belirleyin
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {roomCode
              ? `#${roomCode} numaralı çok oyunculu odaya katılmak üzeresiniz!`
              : 'Canlı imleciniz ve parçalarınız seçtiğiniz renk ve isimle görünecektir.'}
          </p>
        </div>

        {/* Conflict Warning Alert Box */}
        {(errorMessage || nickTaken || colorTaken) && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 flex items-start gap-3 animate-wiggle">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-semibold">
              {errorMessage || (nickTaken
                ? '⚠️ Bu isim odada başka biri tarafından seçilmiş. Lütfen farklı bir isim girin!'
                : '⚠️ Bu renk odada başka biri tarafından seçilmiş. Lütfen boşta olan bir renk seçin!')}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nickname Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-watermelon-500" />
              Takma Adınız (Nickname)
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="Örn: UstaPuzzler, RenkliGöz, vb."
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setErrorMessage(null);
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all outline-none ${
                nickTaken
                  ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/70 focus:bg-white focus:border-watermelon-500 focus:ring-2 focus:ring-watermelon-200'
              }`}
            />
          </div>

          {/* Color Palette Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-watermelon-500" />
                İmleç ve Profil Renginiz
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                (Odadaki herkes farklı renk alır)
              </span>
            </label>

            <div className="grid grid-cols-5 gap-2.5 pt-1">
              {PLAYER_COLORS.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
                const isTaken = takenColors.some(c => c.toLowerCase() === color.hex.toLowerCase());

                return (
                  <button
                    key={color.id}
                    type="button"
                    disabled={isTaken}
                    onClick={() => {
                      if (!isTaken) {
                        setSelectedColor(color.hex);
                        setErrorMessage(null);
                      }
                    }}
                    title={isTaken ? `${color.name} (Başka biri kullanıyor)` : color.name}
                    className={`relative group h-11 rounded-xl transition-all flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 shadow-md ring-4 ring-slate-900/10 z-10'
                        : isTaken
                        ? 'opacity-25 cursor-not-allowed grayscale'
                        : 'hover:scale-105 hover:shadow-sm'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md animate-scale-up" />
                    )}
                    {isTaken && (
                      <span className="text-[10px] text-white font-bold bg-black/40 px-1 rounded">
                        Dolu
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Canlı İmleç Önizlemesi:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white"
                style={{ backgroundColor: selectedColor }}
              />
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: selectedColor }}
              >
                {nickname.trim() || 'İsminiz'}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="watermelon"
            size="lg"
            className="w-full mt-2 font-bold text-base shadow-lg"
            disabled={!nickname.trim() || nickTaken || colorTaken}
          >
            {roomCode ? 'Odaya Bağlan ve Oyna' : 'Profili Kaydet ve Devam Et'}
          </Button>
        </form>
      </div>
    </div>
  );
};
