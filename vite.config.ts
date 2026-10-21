import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
function puzzleRelayPlugin(): Plugin {
  return {
    name: 'puzzle-relay-server',
    async configureServer(server) {
      if (!server.httpServer) return;

      try {
        const wsPkg = await import('ws');
        const WebSocketServer = (wsPkg as any).WebSocketServer || (wsPkg as any).Server || (wsPkg as any).default?.WebSocketServer || (wsPkg as any).default?.Server || (wsPkg as any).default;
        if (!WebSocketServer) return;

        const wss = new WebSocketServer({ noServer: true });
        const rooms = new Map<string, Set<any>>();

        server.httpServer.on('upgrade', (request, socket, head) => {
          const url = new URL(request.url || '', 'http://localhost');
          if (url.pathname === '/ws') {
            wss.handleUpgrade(request, socket, head, (ws: any) => {
              wss.emit('connection', ws, request);
            });
          }
        });

        wss.on('connection', (ws: any) => {
          let currentRoom: string | null = null;

          ws.on('message', (data: any) => {
            try {
              const parsed = JSON.parse(data.toString());
              if (parsed.type === 'JOIN_ROOM') {
                currentRoom = parsed.roomId;
                if (!rooms.has(currentRoom)) {
                  rooms.set(currentRoom, new Set());
                }
                rooms.get(currentRoom)!.add(ws);
                console.log(`[WS Relay] Client joined room: ${currentRoom}. Total connected in room: ${rooms.get(currentRoom)!.size}`);
                return;
              }

              if (currentRoom && rooms.has(currentRoom)) {
                const sockets = rooms.get(currentRoom)!;
                const msgStr = data.toString();
                sockets.forEach((s) => {
                  if (s !== ws && s.readyState === 1) { // 1 = OPEN
                    s.send(msgStr);
                  }
                });
              }
            } catch (e) {
              console.warn('[WS Relay] Message error:', e);
            }
          });

          ws.on('close', () => {
            if (currentRoom && rooms.has(currentRoom)) {
              rooms.get(currentRoom)!.delete(ws);
              if (rooms.get(currentRoom)!.size === 0) {
                rooms.delete(currentRoom);
              }
            }
          });
        });
      } catch (err) {
        console.warn('[WS Relay] Local WebSocket relay not initialized:', err);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), puzzleRelayPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
