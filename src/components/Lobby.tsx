import React, { useState } from 'react';
import { PRESET_IMAGES, PIECE_DIFFICULTIES } from '../data/presets';
import { PresetImage, PuzzleConfig } from '../types/puzzle';
import { Button } from './ui/Button';
import {
  Sparkles,
  PlusCircle,
  LogIn,
  Layers,
  Palette,
  Mountain,
  MousePointer2,
  Users2,
  Share2,
} from 'lucide-react';

interface LobbyProps {
  onStartPreset: (preset: PresetImage, piecesCount: number) => void;
  onOpenCreateModal: () => void;
  onJoinRoomByCode: (code: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartPreset,
  onOpenCreateModal,
  onJoinRoomByCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'art' | 'landscape'>('all');
  const [joinCode, setJoinCode] = useState('');
  const [cardPieceCounts, setCardPieceCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    PRESET_IMAGES.forEach((p) => {
      initial[p.id] = 24; // default 24 pieces
    });
    return initial;
  });
  const [customCardActive, setCustomCardActive] = useState<Record<string, boolean>>({});

  const filteredPresets = PRESET_IMAGES.filter((preset) => {
    if (selectedCategory === 'all') return true;
    return preset.category === selectedCategory;
  });

  const handlePieceCountChange = (presetId: string, count: number) => {
    setCardPieceCounts((prev) => ({ ...prev, [presetId]: count }));
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().replace('#', '');
    if (cleanCode) {
      onJoinRoomByCode(cleanCode);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-watermelon-500 to-amber-500 p-5 sm:p-12 text-white shadow-2xl">
        {/* Background decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl flex flex-col gap-4 sm:gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide w-fit border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            Canlı Çok Oyunculu Eş Zamanlı Puzzle Deneyimi
          </div>

          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-snug sm:leading-tight">
            Arkadaşlarınla Aynı Masada, <br />
            <span className="text-yellow-200 underline decoration-wavy decoration-white/50">
              Canlı İmleçlerle
            </span>{' '}
            Birlikte Puzzle Çöz!
          </h1>

          <p className="text-xs sm:text-base text-white/90 leading-relaxed font-medium">
            Aynı anda parçaları sürükleyin, birbirinizin hareketlerini izleyin ve şaheserleri birlikte tamamlayın.
            10 seçkin sanat eseri veya kendi yükleyeceğiniz görsel ile dilediğiniz parça sayısında hemen başlayın.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <Button
              variant="mint"
              size="lg"
              onClick={onOpenCreateModal}
              icon={<PlusCircle className="w-5 h-5" />}
              className="font-extrabold shadow-xl text-sm sm:text-base px-6 sm:px-7 justify-center"
            >
              Yeni Puzzle Ekle & Oda Kur
            </Button>

            {/* Quick Room Join Form */}
            <form onSubmit={handleJoinSubmit} className="flex items-center justify-between gap-2 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/30">
              <input
                type="text"
                placeholder="Oda Kodu (#12345)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-transparent px-3 py-2 text-xs sm:text-sm placeholder:text-white/60 text-white font-mono font-bold outline-none flex-1 sm:w-44"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-yellow-200 font-bold text-xs transition-colors flex items-center gap-1.5 shadow shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" /> Katıl
              </button>
            </form>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-white/20 mt-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <MousePointer2 className="w-3.5 h-3.5 text-yellow-300" />
              <span>Canlı Fare İmleç Takibi</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <Users2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Özel Renk & Nickname Koruması</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <Share2 className="w-3.5 h-3.5 text-sky-300" />
              <span>1 Tıkla Paylaş & Davet Et</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Gallery Section */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-watermelon-500" />
              10 Seçkin Sanat & Doğa Başyapıtı
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              İstediğiniz görseli seçin, parça sayısını belirleyin ve oyuna başlayın
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü (10)
            </button>
            <button
              onClick={() => setSelectedCategory('art')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'art'
                  ? 'bg-white text-watermelon-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Rönesans & Sanat (5)
            </button>
            <button
              onClick={() => setSelectedCategory('landscape')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'landscape'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              Manzara & Doğa (5)
            </button>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPresets.map((preset) => {
            const currentCount = cardPieceCounts[preset.id] || 24;

            return (
              <div
                key={preset.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                {/* Image Preview with Hover Zoom */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={preset.imageUrl}
                    alt={preset.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/50 backdrop-blur-md uppercase tracking-wider">
                    {preset.category === 'art' ? '🎨 Sanat' : '🏞️ Doğa'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight group-hover:text-watermelon-600 transition-colors">
                      {preset.title}
                    </h3>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">
                      {preset.artistOrLocation}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Piece Count Selector for this specific card */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Zorluk Seviyesi:</span>
                      <span className="text-watermelon-600 font-extrabold">
                        {currentCount} Parça
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {PIECE_DIFFICULTIES.map((diff) => (
                        <button
                          key={diff.count}
                          type="button"
                          onClick={() => {
                            handlePieceCountChange(preset.id, diff.count);
                            setCustomCardActive((prev) => ({ ...prev, [preset.id]: false }));
                          }}
                          className={`py-1 rounded-lg text-[11px] font-bold transition-all ${
                            currentCount === diff.count && !customCardActive[preset.id]
                              ? 'bg-watermelon-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {diff.count}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCardActive((prev) => ({ ...prev, [preset.id]: !prev[preset.id] }));
                        }}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                          customCardActive[preset.id]
                            ? 'bg-watermelon-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Özel
                      </button>
                    </div>

                    {/* Custom Piece Input for this card */}
                    {customCardActive[preset.id] && (
                      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-rose-50/60 border border-watermelon-200 animate-fade-in">
                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Özel Sayı:</span>
                        <input
                          type="number"
                          min={4}
                          max={250}
                          value={currentCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handlePieceCountChange(preset.id, Math.max(4, Math.min(250, val)));
                            }
                          }}
                          className="w-full bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono font-bold text-xs text-center outline-none focus:border-watermelon-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400">parça</span>
                      </div>
                    )}

                    {/* Play Button */}
                    <Button
                      variant="watermelon"
                      size="sm"
                      onClick={() => onStartPreset(preset, currentCount)}
                      className="w-full mt-1 font-bold"
                    >
                      Bu Puzzle'ı Başlat 🧩
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
