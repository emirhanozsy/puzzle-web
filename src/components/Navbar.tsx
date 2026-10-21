import React, { useState } from 'react';
import { Player } from '../types/network';
import { Button } from './ui/Button';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Users,
  PlusCircle,
  Home,
  Edit3,
} from 'lucide-react';
import { toggleSound, isSoundEnabled, playClickSound } from '../utils/audio';

interface NavbarProps {
  roomCode: string | null;
  players: Player[];
  localPlayer: Player | null;
  onOpenCreateModal: () => void;
  onOpenProfileModal: () => void;
  onLeaveRoom?: () => void;
  onCopyInviteLink: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  players,
  localPlayer,
  onOpenCreateModal,
  onOpenProfileModal,
  onLeaveRoom,
  onCopyInviteLink,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleCopy = () => {
    onCopyInviteLink();
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundOn(nextState);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          {onLeaveRoom && roomCode ? (
            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-2 group text-left"
              title="Ana Sayfaya Dön"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-watermelon-500 to-rose-400 text-white flex items-center justify-center text-xl shadow-watermelon transition-transform group-hover:scale-105">
                🍉
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-watermelon-600 transition-colors">
                  Puzzle<span className="text-watermelon-500">Craft</span>
                </span>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Home className="w-3 h-3" /> Odadan Çık
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-watermelon-500 to-rose-400 text-white flex items-center justify-center text-xl shadow-watermelon">
                🍉
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Puzzle<span className="text-watermelon-500">Craft</span>
                </span>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Canlı Çok Oyunculu
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Info & Players (If in room) */}
        {roomCode && (
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* Room Share Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 transition-all active:scale-95"
              title="Arkadaşını davet etmek için linki kopyala"
            >
              <span className="text-slate-400 hidden md:inline">Oda:</span>
              <span className="font-mono text-watermelon-600 font-extrabold uppercase text-[11px] sm:text-xs">
                #{roomCode.slice(-6)}
              </span>
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600 text-[11px] sm:text-xs">
                  <Check className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kopyalandı!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500 text-[11px] sm:text-xs">
                  <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Davet Et</span>
                </span>
              )}
            </button>

            {/* Online Players Roster */}
            <div className="flex items-center -space-x-1 sm:space-x-1 bg-slate-50 p-0.5 sm:p-1 rounded-2xl border border-slate-200/60 max-w-[110px] sm:max-w-none overflow-x-auto scrollbar-none">
              <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-400 px-2">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{players.length} Oyuncu:</span>
              </div>
              {players.map((p) => {
                const isMe = p.id === localPlayer?.id;
                return (
                  <div
                    key={p.id}
                    title={`${p.nickname} ${isMe ? '(Siz)' : ''} - Çözülen: ${p.piecesSolved}`}
                    className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-bold text-white shadow-sm ring-1 sm:ring-2 ring-white transition-transform hover:scale-105 shrink-0 ${
                      isMe ? 'ring-slate-900/10' : ''
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white shadow-sm" />
                    <span className="truncate max-w-[45px] sm:max-w-[100px]">{p.nickname}</span>
                    {p.piecesSolved > 0 && (
                      <span className="text-[9px] sm:text-[10px] bg-black/20 px-1 rounded-full">
                        {p.piecesSolved}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/60"
            title={soundOn ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Edit Profile (Nickname & Color) */}
          {localPlayer && (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-xs font-bold transition-all"
              title="Profilini (İsim ve Renk) Değiştir"
            >
              <div
                className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: localPlayer.color }}
              />
              <span className="hidden sm:inline text-slate-700">{localPlayer.nickname}</span>
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Add New Puzzle Button */}
          <Button
            variant="watermelon"
            size="sm"
            onClick={onOpenCreateModal}
            icon={<PlusCircle className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            Yeni Puzzle Ekle
          </Button>
        </div>
      </div>
    </header>
  );
};
