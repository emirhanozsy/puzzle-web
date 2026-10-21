import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { PuzzleBoard } from './components/PuzzleBoard';
import { GameControls } from './components/GameControls';
import { PlayerModal } from './components/PlayerModal';
import { CreatePuzzleModal } from './components/CreatePuzzleModal';
import { VictoryModal } from './components/VictoryModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { Player } from './types/network';
import { PuzzleConfig, PuzzlePiece, PresetImage } from './types/puzzle';
import { PRESET_IMAGES, PIECE_DIFFICULTIES } from './data/presets';
import { PLAYER_COLORS, isNicknameTaken, isColorTaken } from './utils/colors';
import { createPuzzlePieces, calculateBoardDimensions, loadPuzzleImage, calculateGridFromPieceCount } from './utils/jigsaw';
import { MultiplayerService } from './services/multiplayer';
import { playClickSound, playSnapSound, playConflictSound } from './utils/audio';
import { Button } from './components/ui/Button';
import { Users, ArrowLeft, PlusCircle, Sparkles } from 'lucide-react';

export function App() {
  // --- Local Player State ---
  const [localPlayer, setLocalPlayer] = useState<Player>(() => {
    const savedNick = localStorage.getItem('puzzle_player_nick') || `Puzzler${Math.floor(100 + Math.random() * 900)}`;
    const savedColor = localStorage.getItem('puzzle_player_color') || PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)].hex;
    const playerId = `usr_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: playerId,
      nickname: savedNick,
      color: savedColor,
      cursor: null,
      piecesSolved: 0,
      isHost: false,
      joinedAt: Date.now(),
    };
  });

  // --- Room & Multiplayer State ---
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([localPlayer]);
  const [multiplayer, setMultiplayer] = useState<MultiplayerService | null>(null);
  const multiplayerRef = useRef<MultiplayerService | null>(null);

  // --- Game & Puzzle State ---
  const [puzzleConfig, setPuzzleConfig] = useState<PuzzleConfig | null>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [showGhost, setShowGhost] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState<boolean>(false);

  // --- Modals & UI State ---
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Workspace Dimensions
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 70 : 800,
  });

  // State references for callbacks
  const puzzleConfigRef = useRef<PuzzleConfig | null>(null);
  const piecesRef = useRef<PuzzlePiece[]>([]);
  const playersRef = useRef<Player[]>([]);

  useEffect(() => {
    puzzleConfigRef.current = puzzleConfig;
  }, [puzzleConfig]);

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Keep multiplayer ref updated
  useEffect(() => {
    multiplayerRef.current = multiplayer;
  }, [multiplayer]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: Math.max(300, window.innerHeight - 64),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast notification helper
  const addToast = (type: 'error' | 'success' | 'info', message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Timer Tick ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && puzzleConfig) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, puzzleConfig]);

  // --- Check URL Hash on Mount for Room Invite Link ---
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.startsWith('#room=') || hash.startsWith('#room-') || hash.startsWith('#'))) {
      const code = hash.replace(/#room[=-]?/, '').replace('#', '').trim().toUpperCase();
      if (code) {
        setRoomCode(code);

        // 1. Check local cache (for instant multi-tab sync)
        const cached = localStorage.getItem(`puzzle_room_${code}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.config && parsed.pieces) {
              setPuzzleConfig(parsed.config);
              setPieces(parsed.pieces);
              setIsTimerRunning(true);
            }
          } catch (e) {
            console.warn('Cache load error:', e);
          }
        }

        // 2. Connect to multiplayer room
        initMultiplayer(code, false);
      }
    }
  }, []);

  // --- Check Victory Condition ---
  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p) => p.isLocked)) {
      setIsTimerRunning(false);
      setIsVictoryModalOpen(true);
    }
  }, [pieces]);

  // --- Initialize Puzzle Board & Slicing ---
  const initializePuzzle = async (
    config: PuzzleConfig,
    newRoomCode: string,
    isHostRole: boolean
  ) => {
    setIsLoadingPuzzle(true);
    try {
      const img = await loadPuzzleImage(config.imageUrl);

      // Calculate fitted dimensions responsively
      const isMobile = viewportSize.width < 768;
      const maxBWidth = Math.min(
        viewportSize.width * (isMobile ? 0.92 : 0.72),
        isMobile ? 520 : 850
      );
      const maxBHeight = Math.min(
        (viewportSize.height - (isMobile ? 130 : 110)) * (isMobile ? 0.65 : 0.72),
        isMobile ? 460 : 600
      );
      const { width: bWidth, height: bHeight } = calculateBoardDimensions(
        img.naturalWidth || 1200,
        img.naturalHeight || 800,
        maxBWidth,
        maxBHeight
      );

      const generatedPieces = await createPuzzlePieces(
        img,
        config,
        bWidth,
        bHeight,
        viewportSize.width,
        viewportSize.height
      );

      puzzleConfigRef.current = config;
      piecesRef.current = generatedPieces;

      setPuzzleConfig(config);
      setPieces(generatedPieces);
      setRoomCode(newRoomCode);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setIsVictoryModalOpen(false);

      // Save room to local cache for instant multi-tab sync
      try {
        localStorage.setItem(`puzzle_room_${newRoomCode}`, JSON.stringify({
          config,
          pieces: generatedPieces
        }));
      } catch (e) {
        console.warn('Failed to cache room in localStorage:', e);
      }

      // Update URL hash
      window.location.hash = `room=${newRoomCode}`;

      // Initialize Multiplayer Service
      initMultiplayer(newRoomCode, isHostRole, config, generatedPieces);
    } catch (err) {
      console.error('Failed to create puzzle:', err);
      addToast('error', 'Puzzle yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoadingPuzzle(false);
    }
  };

  // --- Setup Multiplayer Service ---
  const initMultiplayer = (
    code: string,
    isHostRole: boolean,
    currentConfig?: PuzzleConfig,
    currentPieces?: PuzzlePiece[]
  ) => {
    if (multiplayerRef.current) {
      multiplayerRef.current.destroy();
    }

    const updatedLocal = { ...localPlayer, isHost: isHostRole };
    setLocalPlayer(updatedLocal);
    setPlayers([updatedLocal]);

    const service = new MultiplayerService(code, updatedLocal, isHostRole, {
      onPlayerJoined: (incomingPlayer) => {
        // Don't process our own HELLO messages
        if (incomingPlayer.id === updatedLocal.id) return;

        setPlayers((prev) => {
          if (isHostRole) {
            // If this player ID is already known, just update their info (no re-validation)
            const existingPlayer = prev.find((p) => p.id === incomingPlayer.id);
            if (existingPlayer) {
              const updated = prev.map((p) => p.id === incomingPlayer.id ? incomingPlayer : p);

              // Re-send accept with current board state
              const curCfg = puzzleConfigRef.current || currentConfig;
              const curPieces = piecesRef.current.length > 0 ? piecesRef.current : currentPieces || [];
              if (curCfg) {
                service.broadcastMessage({
                  type: 'HELLO_ACCEPT',
                  senderId: updatedLocal.id,
                  timestamp: Date.now(),
                  players: updated,
                  config: curCfg,
                  pieces: curPieces,
                });
              }
              return updated;
            }

            // New player — validate nickname & color against OTHER players only
            const otherNicknames = prev.map((p) => p.nickname);
            const otherColors = prev.map((p) => p.color);

            const nickTaken = isNicknameTaken(
              incomingPlayer.nickname,
              otherNicknames
            );
            const colorTaken = isColorTaken(
              incomingPlayer.color,
              otherColors
            );

            if (nickTaken) {
              service.broadcastMessage({
                type: 'HELLO_REJECT',
                senderId: updatedLocal.id,
                timestamp: Date.now(),
                reason: 'NICKNAME_TAKEN',
                message: `"${incomingPlayer.nickname}" takma adı odada zaten kullanılıyor!`,
                targetId: incomingPlayer.id,
              });
              return prev;
            }

            if (colorTaken) {
              service.broadcastMessage({
                type: 'HELLO_REJECT',
                senderId: updatedLocal.id,
                timestamp: Date.now(),
                reason: 'COLOR_TAKEN',
                message: 'Seçtiğiniz renk bu odada zaten kullanılıyor!',
                targetId: incomingPlayer.id,
              });
              return prev;
            }

            // Accept and send current board state
            const updated = [...prev, incomingPlayer];
            const curCfg = puzzleConfigRef.current || currentConfig;
            const curPieces = piecesRef.current.length > 0 ? piecesRef.current : currentPieces || [];

            if (curCfg) {
              service.broadcastMessage({
                type: 'HELLO_ACCEPT',
                senderId: updatedLocal.id,
                timestamp: Date.now(),
                players: updated,
                config: curCfg,
                pieces: curPieces,
              });
            }

            service.broadcastMessage({
              type: 'PLAYERS_UPDATE',
              senderId: updatedLocal.id,
              timestamp: Date.now(),
              players: updated,
            });

            addToast('info', `${incomingPlayer.nickname} odaya katıldı! 🎉`);
            return updated;
          }

          // Client receiving other player join
          const exists = prev.some((p) => p.id === incomingPlayer.id);
          if (!exists) {
            addToast('info', `${incomingPlayer.nickname} odaya katıldı!`);
            return [...prev, incomingPlayer];
          }
          return prev.map((p) => p.id === incomingPlayer.id ? incomingPlayer : p);
        });
      },

      onHelloReject: (reason, message) => {
        playConflictSound();
        setConflictError(message);
        setIsPlayerModalOpen(true);
        addToast('error', message, 'Odaya Katılma Uyarısı');
      },

      onHelloAccept: (acceptMsg) => {
        setPlayers(acceptMsg.players);
        setPuzzleConfig(acceptMsg.config);
        setPieces(acceptMsg.pieces);
        setIsTimerRunning(true);
        addToast('success', 'Odaya başarıyla bağlandınız! Birlikte puzzle yapabilirsiniz.');
      },

      onPlayersUpdate: (updatedPlayers) => {
        setPlayers(updatedPlayers);
      },

      onPlayerLeft: (playerId) => {
        setPlayers((prev) => {
          const departing = prev.find((p) => p.id === playerId);
          if (departing) {
            addToast('info', `${departing.nickname} odadan ayrıldı.`);
          }
          return prev.filter((p) => p.id !== playerId);
        });
      },

      onCursorMove: (remotePlayerId, x, y, active) => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === remotePlayerId ? { ...p, cursor: { x, y, active } } : p
          )
        );
      },

      onPieceGrab: (pieceId, remotePlayer) => {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === pieceId
              ? {
                  ...p,
                  beingDraggedBy: {
                    playerId: remotePlayer.id,
                    nickname: remotePlayer.nickname,
                    color: remotePlayer.color,
                  },
                }
              : p
          )
        );
      },

      onPieceMove: (pieceId, x, y) => {
        setPieces((prev) =>
          prev.map((p) => (p.id === pieceId ? { ...p, currentX: x, currentY: y } : p))
        );
      },

      onPieceRelease: (pieceId, x, y) => {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === pieceId ? { ...p, currentX: x, currentY: y, beingDraggedBy: null } : p
          )
        );
      },

      onPieceSnap: (pieceId, remotePlayer) => {
        playSnapSound();
        setPieces((prev) =>
          prev.map((p) =>
            p.id === pieceId
              ? {
                  ...p,
                  isLocked: true,
                  beingDraggedBy: null,
                  lockedByNickname: remotePlayer.nickname,
                  lockedByColor: remotePlayer.color,
                }
              : p
          )
        );

        // Update remote player solved count
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === remotePlayer.id ? { ...p, piecesSolved: p.piecesSolved + 1 } : p
          )
        );
      },

      onBoardSync: (syncMsg) => {
        setPieces(syncMsg.pieces);
        setPuzzleConfig(syncMsg.config);
      },

      onResetPuzzle: () => {
        setPieces((prev) =>
          prev.map((p) => ({
            ...p,
            isLocked: false,
            beingDraggedBy: null,
            currentX: Math.random() * (viewportSize.width - 200) + 50,
            currentY: Math.random() * (viewportSize.height - 200) + 50,
          }))
        );
        addToast('info', 'Puzzle yeniden karıştırıldı!');
      },
    });

    setMultiplayer(service);
  };

  // --- Handlers for Game Interactions ---
  const handlePieceGrab = useCallback((pieceId: number) => {
    multiplayerRef.current?.broadcastMessage({
      type: 'PIECE_GRAB',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieceId,
      nickname: localPlayer.nickname,
      color: localPlayer.color,
    });
  }, [localPlayer]);

  const handlePieceMove = useCallback((pieceId: number, x: number, y: number) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, currentX: x, currentY: y } : p))
    );

    multiplayerRef.current?.broadcastMessage({
      type: 'PIECE_MOVE',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieceId,
      x,
      y,
    });
  }, [localPlayer]);

  const handlePieceRelease = useCallback((pieceId: number, x: number, y: number) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, currentX: x, currentY: y, beingDraggedBy: null } : p))
    );

    multiplayerRef.current?.broadcastMessage({
      type: 'PIECE_RELEASE',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieceId,
      x,
      y,
    });
  }, [localPlayer]);

  const handlePieceSnap = useCallback((pieceId: number) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              isLocked: true,
              beingDraggedBy: null,
              lockedByNickname: localPlayer.nickname,
              lockedByColor: localPlayer.color,
            }
          : p
      )
    );

    // Increment local player score
    setLocalPlayer((prev) => ({ ...prev, piecesSolved: prev.piecesSolved + 1 }));
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === localPlayer.id ? { ...p, piecesSolved: p.piecesSolved + 1 } : p
      )
    );

    multiplayerRef.current?.broadcastMessage({
      type: 'PIECE_SNAP',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieceId,
      nickname: localPlayer.nickname,
      color: localPlayer.color,
    });
  }, [localPlayer]);

  const handleCursorMove = useCallback((x: number, y: number, active: boolean) => {
    multiplayerRef.current?.broadcastMessage({
      type: 'CURSOR_MOVE',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      x,
      y,
      active,
    });
  }, [localPlayer]);

  // --- Arrange unplaced pieces neatly to sides ---
  const handleArrangePieces = () => {
    if (!puzzleConfig) return;
    const unlocked = pieces.filter((p) => !p.isLocked);
    const half = Math.ceil(unlocked.length / 2);

    const isMobile = viewportSize.width < 768;
    const margin = isMobile ? 8 : 20;

    const updated = pieces.map((piece) => {
      if (piece.isLocked) return piece;

      const idx = unlocked.findIndex((u) => u.id === piece.id);
      const isLeft = idx < half;
      const slot = isLeft ? idx : idx - half;
      const slotsPerCol = Math.max(1, Math.floor((viewportSize.height - 140) / (piece.height + 12)));

      const col = Math.floor(slot / slotsPerCol);
      const row = slot % slotsPerCol;

      let newX = isLeft
        ? margin + col * (piece.width + 8)
        : viewportSize.width - (piece.width + margin) - col * (piece.width + 8);
      let newY = margin + 50 + row * (piece.height + 10);

      // Clamp strictly within viewport
      newX = Math.max(8, Math.min(viewportSize.width - piece.width - 8, newX));
      newY = Math.max(8, Math.min(viewportSize.height - piece.height - 80, newY));

      return {
        ...piece,
        currentX: Math.round(newX),
        currentY: Math.round(newY),
      };
    });

    setPieces(updated);
    multiplayerRef.current?.broadcastMessage({
      type: 'BOARD_SYNC',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieces: updated,
      config: puzzleConfig,
    });

    addToast('info', 'Parçalar kenarlara düzenlendi.');
  };

  // --- Reset Puzzle ---
  const handleResetPuzzle = () => {
    if (!puzzleConfig) return;
    const scattered = pieces.map((p) => {
      const pWidth = p.width || 60;
      const pHeight = p.height || 60;
      const maxX = Math.max(20, viewportSize.width - pWidth - 20);
      const maxY = Math.max(20, viewportSize.height - pHeight - 90);

      return {
        ...p,
        isLocked: false,
        beingDraggedBy: null,
        currentX: Math.round(Math.random() * maxX + 10),
        currentY: Math.round(Math.random() * maxY + 10),
      };
    });

    setPieces(scattered);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsVictoryModalOpen(false);

    multiplayerRef.current?.broadcastMessage({
      type: 'RESET_PUZZLE',
      senderId: localPlayer.id,
      timestamp: Date.now(),
      pieces: scattered,
    });
  };

  // --- Profile / Nickname / Color Save ---
  const handleSaveProfile = (nickname: string, color: string) => {
    localStorage.setItem('puzzle_player_nick', nickname);
    localStorage.setItem('puzzle_player_color', color);

    const updated = { ...localPlayer, nickname, color };
    setLocalPlayer(updated);
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setIsPlayerModalOpen(false);
    setConflictError(null);

    multiplayerRef.current?.updateLocalPlayer(updated);
    multiplayerRef.current?.broadcastMessage({
      type: 'HELLO',
      senderId: updated.id,
      timestamp: Date.now(),
      player: updated,
    });

    addToast('success', `Profiliniz güncellendi: ${nickname}`);

    // If currently in a room without puzzle loaded, try restoring from cache or query
    if (roomCode && !puzzleConfig) {
      const cached = localStorage.getItem(`puzzle_room_${roomCode}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.config && parsed.pieces) {
            setPuzzleConfig(parsed.config);
            setPieces(parsed.pieces);
            setIsTimerRunning(true);
          }
        } catch (e) {
          console.warn('Cache restore error:', e);
        }
      }
      // No need for extra announceHello() — the broadcastMessage(HELLO) above already announced us
    }
  };

  // --- Start Preset from Lobby ---
  const handleStartPreset = (preset: PresetImage, piecesCount: number) => {
    const diff = PIECE_DIFFICULTIES.find((d) => d.count === piecesCount);
    const grid = diff
      ? { rows: diff.rows, cols: diff.cols, totalPieces: diff.count }
      : calculateGridFromPieceCount(piecesCount);

    const newRoomCode = `PZ${Math.floor(1000 + Math.random() * 9000)}`;

    const config: PuzzleConfig = {
      id: `${preset.id}-${Date.now()}`,
      title: preset.title,
      artistOrLocation: preset.artistOrLocation,
      imageUrl: preset.imageUrl,
      rows: grid.rows,
      cols: grid.cols,
      totalPieces: grid.totalPieces,
    };

    initializePuzzle(config, newRoomCode, true);
  };

  // --- Start Custom Created Puzzle ---
  const handleCreateCustomPuzzle = (config: PuzzleConfig) => {
    setIsCreateModalOpen(false);
    const newRoomCode = `PZ${Math.floor(1000 + Math.random() * 9000)}`;
    initializePuzzle(config, newRoomCode, true);
  };

  // --- Join Existing Room By Code ---
  const handleJoinRoomByCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setRoomCode(cleanCode);
    window.location.hash = `room=${cleanCode}`;

    // 1. Check local cache (for instant multi-tab sync)
    const cached = localStorage.getItem(`puzzle_room_${cleanCode}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.config && parsed.pieces) {
          setPuzzleConfig(parsed.config);
          setPieces(parsed.pieces);
          setIsTimerRunning(true);
        }
      } catch (e) {
        console.warn('Cache load error:', e);
      }
    }

    // 2. Connect to multiplayer room
    initMultiplayer(cleanCode, false);
    addToast('info', `#${cleanCode} numaralı odaya bağlanılıyor...`);
  };

  // --- Leave Current Room ---
  const handleLeaveRoom = () => {
    if (multiplayerRef.current) {
      multiplayerRef.current.destroy();
      setMultiplayer(null);
    }
    setRoomCode(null);
    setPuzzleConfig(null);
    setPieces([]);
    setIsTimerRunning(false);
    setIsVictoryModalOpen(false);
    window.location.hash = '';
    setPlayers([localPlayer]);
  };

  // --- Copy Invite Link ---
  const handleCopyInviteLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
    navigator.clipboard.writeText(url);
    addToast('success', 'Oda davet bağlantısı panoya kopyalandı! Arkadaşına gönder.');
  };

  const piecesSolvedCount = pieces.filter((p) => p.isLocked).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50/60 via-slate-50 to-emerald-50/60 text-slate-800">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation Header */}
      <Navbar
        roomCode={roomCode}
        players={players}
        localPlayer={localPlayer}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenProfileModal={() => setIsPlayerModalOpen(true)}
        onLeaveRoom={roomCode ? handleLeaveRoom : undefined}
        onCopyInviteLink={handleCopyInviteLink}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {isLoadingPuzzle && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-watermelon-500 to-rose-400 text-white flex items-center justify-center text-3xl shadow-watermelon animate-bounce">
              🧩
            </div>
            <div className="mt-4 text-base font-extrabold text-slate-900">
              Puzzle Parçaları Hazırlanıyor...
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gerçekçi jigsaw tırnakları ve renkler kesiliyor
            </div>
          </div>
        )}

        {!roomCode ? (
          /* Lobby / Home Page (Only when not in a room) */
          <Lobby
            onStartPreset={handleStartPreset}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onJoinRoomByCode={handleJoinRoomByCode}
          />
        ) : !puzzleConfig ? (
          /* Room Connected - Waiting for Host or Puzzle Selection */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-fade-in my-auto">
            <div className="w-20 h-20 rounded-3xl bg-watermelon-50 text-watermelon-500 flex items-center justify-center text-4xl shadow-watermelon animate-bounce mb-4">
              🍉
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-bold text-slate-700 mb-2 border border-slate-200">
              <span>Oda Kodu:</span>
              <span className="text-watermelon-600 font-extrabold uppercase">#{roomCode}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Odaya Başarıyla Katıldınız! 🎮
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Oda sahibiyle bağlantı kuruluyor ve puzzle masası senkronize ediliyor...
            </p>

            {/* Players in this room */}
            <div className="mt-6 w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Odadaki Oyuncular ({players.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>{p.nickname}</span>
                    {p.id === localPlayer.id && <span className="opacity-80 text-[10px]">(Siz)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="md"
                onClick={handleLeaveRoom}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Odadan Çık / Ana Sayfa
              </Button>
              <Button
                variant="watermelon"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<PlusCircle className="w-4 h-4" />}
                className="shadow-md"
              >
                Bu Odada Yeni Puzzle Başlat 🧩
              </Button>
            </div>
          </div>
        ) : (
          /* Active Puzzle Board */
          <div className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden">
            {(() => {
              const isMobile = viewportSize.width < 768;
              const actualBoardWidth =
                pieces.length > 0 && pieces[0]?.width
                  ? pieces[0].width * puzzleConfig.cols
                  : Math.min(viewportSize.width * (isMobile ? 0.92 : 0.72), isMobile ? 520 : 850);
              const actualBoardHeight =
                pieces.length > 0 && pieces[0]?.height
                  ? pieces[0].height * puzzleConfig.rows
                  : Math.min(
                      (viewportSize.height - (isMobile ? 130 : 110)) * (isMobile ? 0.65 : 0.72),
                      isMobile ? 460 : 600
                    );

              return (
                <PuzzleBoard
                  config={puzzleConfig}
                  pieces={pieces}
                  players={players}
                  localPlayer={localPlayer}
                  showGhost={showGhost}
                  onPieceMove={handlePieceMove}
                  onPieceGrab={handlePieceGrab}
                  onPieceRelease={handlePieceRelease}
                  onPieceSnap={handlePieceSnap}
                  onCursorMove={handleCursorMove}
                  boardWidth={actualBoardWidth}
                  boardHeight={actualBoardHeight}
                  containerWidth={viewportSize.width}
                  containerHeight={viewportSize.height}
                />
              );
            })()}

            {/* Bottom Game Controls Dock */}
            <GameControls
              piecesSolved={piecesSolvedCount}
              totalPieces={puzzleConfig.totalPieces}
              timerSeconds={timerSeconds}
              showGhost={showGhost}
              onToggleGhost={() => setShowGhost(!showGhost)}
              onArrangePieces={handleArrangePieces}
              onResetPuzzle={handleResetPuzzle}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        initialNickname={localPlayer.nickname}
        initialColor={localPlayer.color}
        existingPlayers={players}
        currentUserId={localPlayer.id}
        roomCode={roomCode || undefined}
        conflictError={conflictError}
        onSave={handleSaveProfile}
      />

      <CreatePuzzleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePuzzle={handleCreateCustomPuzzle}
      />

      <VictoryModal
        isOpen={isVictoryModalOpen}
        timeElapsed={timerSeconds}
        totalPieces={puzzleConfig?.totalPieces || 0}
        players={players}
        onRestart={handleResetPuzzle}
        onNewPuzzle={handleLeaveRoom}
      />
    </div>
  );
}
export default App;
