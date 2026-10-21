import Peer, { DataConnection } from 'peerjs';
import { Player, NetworkMessage } from '../types/network';

export interface MultiplayerCallbacks {
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onCursorMove?: (playerId: string, x: number, y: number, active: boolean) => void;
  onPieceGrab?: (pieceId: number, player: { id: string; nickname: string; color: string }) => void;
  onPieceMove?: (pieceId: number, x: number, y: number) => void;
  onPieceRelease?: (pieceId: number, x: number, y: number) => void;
  onPieceSnap?: (pieceId: number, player: { id: string; nickname: string; color: string }) => void;
  onBoardSync?: (message: Extract<NetworkMessage, { type: 'BOARD_SYNC' }>) => void;
  onHelloAccept?: (message: Extract<NetworkMessage, { type: 'HELLO_ACCEPT' }>) => void;
  onHelloReject?: (reason: string, message: string) => void;
  onResetPuzzle?: () => void;
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'error', errorMsg?: string) => void;
}

export class MultiplayerService {
  private roomId: string;
  private localPlayer: Player;
  private isHost: boolean;
  private callbacks: MultiplayerCallbacks;

  // Local / LAN WebSocket Relay
  private ws: WebSocket | null = null;
  private isWsConnected: boolean = false;

  // WebRTC PeerJS
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  // Same-browser multi-tab BroadcastChannel
  private broadcastChannel: BroadcastChannel | null = null;

  // Processed message deduplication
  private recentMessageKeys: Set<string> = new Set();

  constructor(roomId: string, localPlayer: Player, isHost: boolean, callbacks: MultiplayerCallbacks) {
    this.roomId = roomId;
    this.localPlayer = localPlayer;
    this.isHost = isHost;
    this.callbacks = callbacks;

    // 1. Initialize local WebSocket relay (works across different devices on same network!)
    this.initWebSocket();

    // 2. Initialize BroadcastChannel (instant multi-tab synchronization)
    this.initBroadcastChannel();

    // 3. Initialize PeerJS WebRTC (works across internet / Vercel cloud)
    this.initPeer();
  }

  // --- 1. WebSocket Relay for Cross-Device Local / LAN Synchronization ---
  private initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isWsConnected = true;
        console.log('[Multiplayer WS] Connected to relay server:', wsUrl);
        // Subscribe to room
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: this.roomId }));
        this.callbacks.onConnectionStatus?.('connected');

        // Announce presence immediately
        setTimeout(() => {
          this.announceHello();
        }, 80);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg || msg.senderId === this.localPlayer.id) return;
          this.handleIncomingMessage(msg);
        } catch (e) {
          console.warn('[Multiplayer WS] Error parsing message:', e);
        }
      };

      ws.onerror = () => {
        this.isWsConnected = false;
      };

      ws.onclose = () => {
        this.isWsConnected = false;
      };
    } catch (e) {
      console.warn('[Multiplayer WS] Init error:', e);
    }
  }

  // --- 2. BroadcastChannel for instant local multi-window / multi-tab support ---
  private initBroadcastChannel() {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    try {
      this.broadcastChannel = new BroadcastChannel(`puzzle-room-${this.roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage;
        if (!msg || msg.senderId === this.localPlayer.id) return;
        this.handleIncomingMessage(msg);
      };

      // Announce presence immediately to local tabs
      if (!this.isHost) {
        setTimeout(() => {
          this.announceHello();
        }, 100);
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed:', e);
    }
  }

  public announceHello() {
    this.broadcastMessage({
      type: 'HELLO',
      senderId: this.localPlayer.id,
      timestamp: Date.now(),
      player: this.localPlayer,
    });
  }

  // --- 3. PeerJS for WebRTC connection across devices ---
  private initPeer() {
    const cleanRoomId = this.roomId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    const hostPeerId = `pz-${cleanRoomId}-host`;
    const peerId = this.isHost
      ? hostPeerId
      : `pz-${cleanRoomId}-p-${this.localPlayer.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', () => {
        this.callbacks.onConnectionStatus?.('connected');

        if (!this.isHost) {
          // Client connects to host
          this.connectToHost(hostPeerId);
        } else {
          this.announceHello();
        }
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS status:', err.type, err.message);
        this.callbacks.onConnectionStatus?.('connected');
      });

      this.peer.on('disconnected', () => {
        this.peer?.reconnect();
      });
    } catch (e) {
      console.warn('Failed to initialize PeerJS:', e);
      this.callbacks.onConnectionStatus?.('connected');
    }
  }

  private connectToHost(hostPeerId: string) {
    if (!this.peer) return;

    try {
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        console.log('[Multiplayer PeerJS] Connected to host data channel');
        this.announceHello();
      });

      conn.on('data', (data) => {
        this.handleIncomingMessage(data as NetworkMessage);
      });

      conn.on('close', () => {
        this.hostConnection = null;
      });

      conn.on('error', (err) => {
        console.warn('Host data channel error:', err);
      });
    } catch (e) {
      console.warn('connectToHost failed:', e);
    }
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      console.log('[Multiplayer PeerJS] Incoming peer data channel open:', conn.peer);
    });

    conn.on('data', (data) => {
      this.handleIncomingMessage(data as NetworkMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('Incoming peer data connection error:', err);
    });
  }

  // --- Message Handling & Routing ---
  private handleIncomingMessage(msg: NetworkMessage) {
    // Deduplication check
    const dedupKey = `${msg.senderId}_${msg.type}_${msg.timestamp}_${(msg as unknown as { pieceId?: number }).pieceId ?? ''}`;
    if (this.recentMessageKeys.has(dedupKey)) {
      return;
    }
    this.recentMessageKeys.add(dedupKey);
    if (this.recentMessageKeys.size > 200) {
      const first = this.recentMessageKeys.values().next().value;
      if (first) this.recentMessageKeys.delete(first);
    }

    switch (msg.type) {
      case 'HELLO':
        this.callbacks.onPlayerJoined?.(msg.player);
        break;

      case 'HELLO_REJECT':
        // Only process rejections targeted at us
        if (!msg.targetId || msg.targetId === this.localPlayer.id) {
          this.callbacks.onHelloReject?.(msg.reason, msg.message);
        }
        break;

      case 'HELLO_ACCEPT':
        this.callbacks.onHelloAccept?.(msg);
        break;

      case 'PLAYERS_UPDATE':
        this.callbacks.onPlayersUpdate?.(msg.players);
        break;

      case 'PLAYER_LEFT':
        this.callbacks.onPlayerLeft?.(msg.playerId);
        break;

      case 'CURSOR_MOVE':
        this.callbacks.onCursorMove?.(msg.senderId, msg.x, msg.y, msg.active);
        break;

      case 'PIECE_GRAB':
        this.callbacks.onPieceGrab?.(msg.pieceId, {
          id: msg.senderId,
          nickname: msg.nickname,
          color: msg.color
        });
        break;

      case 'PIECE_MOVE':
        this.callbacks.onPieceMove?.(msg.pieceId, msg.x, msg.y);
        break;

      case 'PIECE_RELEASE':
        this.callbacks.onPieceRelease?.(msg.pieceId, msg.x, msg.y);
        break;

      case 'PIECE_SNAP':
        this.callbacks.onPieceSnap?.(msg.pieceId, {
          id: msg.senderId,
          nickname: msg.nickname,
          color: msg.color
        });
        break;

      case 'BOARD_SYNC':
        this.callbacks.onBoardSync?.(msg);
        break;

      case 'RESET_PUZZLE':
        this.callbacks.onResetPuzzle?.();
        break;
    }
  }

  // Broadcast message to all connected peers, WebSocket relay, and broadcast channel
  public broadcastMessage(msg: NetworkMessage) {
    // 1. Send via WebSocket Relay (Cross-Device LAN / Local)
    if (this.ws && this.isWsConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (e) {
        console.warn('[Multiplayer WS] Send error:', e);
      }
    }

    // 2. Send to BroadcastChannel (Local browser tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 3. Send via WebRTC DataConnection (Cross-Device PeerJS)
    if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(msg);
      } catch (e) {
        console.warn('Peer send to host error:', e);
      }
    }

    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('Peer send to client error:', e);
        }
      }
    });
  }

  public updateLocalPlayer(player: Player) {
    this.localPlayer = player;
  }

  public destroy() {
    // Leave room message
    this.broadcastMessage({
      type: 'PLAYER_LEFT',
      senderId: this.localPlayer.id,
      playerId: this.localPlayer.id,
      timestamp: Date.now()
    });

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isWsConnected = false;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.connections.forEach(conn => conn.close());
    this.connections.clear();

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
