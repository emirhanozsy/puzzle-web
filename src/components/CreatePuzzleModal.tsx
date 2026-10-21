import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Sparkles, SlidersHorizontal, Hash, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { PIECE_DIFFICULTIES, PRESET_IMAGES } from '../data/presets';
import { PuzzleConfig } from '../types/puzzle';
import { calculateGridFromPieceCount } from '../utils/jigsaw';

interface CreatePuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePuzzle: (config: PuzzleConfig) => void;
}

export const CreatePuzzleModal: React.FC<CreatePuzzleModalProps> = ({
  isOpen,
  onClose,
  onCreatePuzzle,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'preset'>('upload');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_IMAGES[0].id);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(PIECE_DIFFICULTIES[1]); // default 24 pieces
  const [isCustomPieceCount, setIsCustomPieceCount] = useState<boolean>(false);
  const [customPieceCount, setCustomPieceCount] = useState<number>(36);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewSrc(result);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrl = '';
    let finalTitle = title.trim();

    if (activeTab === 'upload') {
      if (!previewSrc) {
        alert('Lütfen bir görsel yükleyin.');
        return;
      }
      finalImageUrl = previewSrc;
      if (!finalTitle) finalTitle = 'Özel Yüklenen Puzzle';
    } else if (activeTab === 'url') {
      if (!imageUrl.trim()) {
        alert('Lütfen geçerli bir görsel URL adresi girin.');
        return;
      }
      finalImageUrl = imageUrl.trim();
      if (!finalTitle) finalTitle = 'İnternet Görseli';
    } else {
      const preset = PRESET_IMAGES.find(p => p.id === selectedPresetId) || PRESET_IMAGES[0];
      finalImageUrl = preset.imageUrl;
      if (!finalTitle) finalTitle = preset.title;
    }

    let rows = selectedDifficulty.rows;
    let cols = selectedDifficulty.cols;
    let totalPieces = selectedDifficulty.count;

    if (isCustomPieceCount) {
      const customGrid = calculateGridFromPieceCount(customPieceCount);
      rows = customGrid.rows;
      cols = customGrid.cols;
      totalPieces = customGrid.totalPieces;
    }

    const newConfig: PuzzleConfig = {
      id: `puzzle-${Date.now()}`,
      title: finalTitle,
      imageUrl: finalImageUrl,
      rows,
      cols,
      totalPieces,
    };

    onCreatePuzzle(newConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 sm:gap-6 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-watermelon-50 text-watermelon-500 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Yeni Puzzle Ekle</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Kendi görselinizi yükleyin veya galeriden seçip oda oluşturun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-watermelon-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Cihazdan Yükle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'preset'
                ? 'bg-white text-watermelon-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Hazır Galeriden
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'url'
                ? 'bg-white text-watermelon-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Resim Linki
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Tab Content: Upload */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-watermelon-500 bg-watermelon-50/50'
                  : previewSrc
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-watermelon-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              {previewSrc ? (
                <div className="relative w-full max-h-52 overflow-hidden rounded-xl border shadow-sm">
                  <img src={previewSrc} alt="Preview" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center text-white font-semibold text-xs transition-opacity">
                    Farklı bir görsel seçmek için tıklayın
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-watermelon-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Görseli buraya sürükleyin veya <span className="text-watermelon-600 underline">göz atın</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">PNG, JPG, WebP (Önerilen: Yüksek çözünürlük)</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Content: Preset Gallery */}
          {activeTab === 'preset' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setTitle(preset.title);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all group ${
                      isSelected
                        ? 'border-watermelon-500 ring-4 ring-watermelon-100 scale-102'
                        : 'border-transparent hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.thumbnailUrl} alt={preset.title} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-watermelon-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-left">
                      <div className="text-[10px] font-bold text-white truncate">{preset.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content: URL */}
          {activeTab === 'url' && (
            <div className="flex flex-col gap-3">
              <input
                type="url"
                placeholder="https://example.com/resim.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewSrc(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-watermelon-500 focus:ring-2 focus:ring-watermelon-200"
              />
              {imageUrl && (
                <div className="w-full max-h-48 overflow-hidden rounded-xl border">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={() => alert('Görsel URL yüklenemedi. Lütfen geçerli bir doğrudan resim bağlantısı girin.')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Puzzle Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Puzzle Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Hafta Sonu Meydan Okuması"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-watermelon-500 focus:ring-2 focus:ring-watermelon-200"
            />
          </div>

          {/* Piece Count / Difficulty Selector */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Puzzle Parça Sayısı Seçimi
              </label>
              {isCustomPieceCount && (
                <span className="text-xs font-bold text-watermelon-600">
                  Özel Parça Modu Aktif ✨
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {PIECE_DIFFICULTIES.map((diff) => {
                const isSelected = !isCustomPieceCount && selectedDifficulty.count === diff.count;
                return (
                  <button
                    key={diff.count}
                    type="button"
                    onClick={() => {
                      setSelectedDifficulty(diff);
                      setIsCustomPieceCount(false);
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-watermelon-500 bg-rose-50/70 shadow-sm scale-102 ring-2 ring-watermelon-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">{diff.label}</div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">{diff.tag}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1">({diff.cols}x{diff.rows} ızgara)</div>
                  </button>
                );
              })}

              {/* Custom Piece Count Card Button */}
              <button
                type="button"
                onClick={() => setIsCustomPieceCount(true)}
                className={`p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all col-span-2 sm:col-span-1 ${
                  isCustomPieceCount
                    ? 'border-watermelon-500 bg-rose-50/70 shadow-sm scale-102 ring-2 ring-watermelon-200'
                    : 'border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-extrabold text-watermelon-600">Özel Sayı</span>
                  <SlidersHorizontal className="w-4 h-4 text-watermelon-500" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">İstediğin Kadar</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                  {isCustomPieceCount ? `${customPieceCount} parça` : '4-250 parça'}
                </div>
              </button>
            </div>

            {/* Custom Piece Configuration Box (when active) */}
            {isCustomPieceCount && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/50 to-amber-50/30 border-2 border-watermelon-200 flex flex-col gap-3 animate-fade-in mt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-watermelon-500" />
                    <span className="text-xs font-bold text-slate-700">İstediğiniz Parça Sayısını Girin veya Kaydırın:</span>
                  </div>

                  {/* Number Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={4}
                      max={250}
                      value={customPieceCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setCustomPieceCount(Math.max(4, Math.min(250, val)));
                        }
                      }}
                      className="w-20 px-3 py-1.5 rounded-xl border-2 border-watermelon-300 bg-white text-center font-mono font-black text-slate-900 text-sm outline-none focus:ring-2 focus:ring-watermelon-400"
                    />
                    <span className="text-xs font-bold text-slate-500">Parça</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={6}
                  max={200}
                  step={2}
                  value={customPieceCount}
                  onChange={(e) => setCustomPieceCount(parseInt(e.target.value, 10))}
                  className="w-full accent-watermelon-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                {/* Quick Presets Row */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Hızlı Seçim:</span>
                  {[16, 30, 36, 50, 64, 80, 100, 150].map((presetCount) => (
                    <button
                      key={presetCount}
                      type="button"
                      onClick={() => setCustomPieceCount(presetCount)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        customPieceCount === presetCount
                          ? 'bg-watermelon-500 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {presetCount}
                    </button>
                  ))}
                </div>

                {/* Live Calculated Grid Preview */}
                {(() => {
                  const grid = calculateGridFromPieceCount(customPieceCount);
                  return (
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-white/80 p-2.5 rounded-xl border border-watermelon-100 mt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Hesaplanan Izgara Düzeni:
                      </span>
                      <span className="font-mono font-extrabold text-watermelon-600">
                        {grid.cols} sütun × {grid.rows} satır = toplam {grid.totalPieces} parça
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="order-2 sm:order-1 justify-center">
              Vazgeç
            </Button>
            <Button type="submit" variant="watermelon" size="lg" className="order-1 sm:order-2 px-5 sm:px-8 shadow-lg justify-center text-sm sm:text-base">
              Puzzle'ı Başlat ve Odayı Kur 🚀
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
