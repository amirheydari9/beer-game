"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameWebSocket = void 0;
exports.registerGameWebSocket = registerGameWebSocket;
const ws_1 = require("ws");
class GameWebSocket {
    app;
    gameService;
    wss = new ws_1.WebSocketServer({
        noServer: true,
    });
    connections = new Map();
    constructor(app, gameService) {
        this.app = app;
        this.gameService = gameService;
        this.registerUpgrade();
        this.registerConnections();
        this.gameService.onGameChanged((gameId, event) => {
            this.broadcast(gameId, {
                type: event.type,
                state: this.gameService
                    .getGame(gameId)
                    ?.getState(),
                players: this.gameService
                    .getGame(gameId)
                    ?.getPlayers(),
                ...(event.type === 'order-placed'
                    ? {
                        orders: event.orders,
                    }
                    : {}),
            });
        });
    }
    registerUpgrade() {
        this.app.server.on('upgrade', (request, socket, head) => {
            const url = new URL(request.url ?? '/', 'http://localhost');
            const match = url.pathname.match(/^\/games\/([^/]+)\/ws$/);
            if (!match) {
                return;
            }
            const gameId = match[1];
            if (!gameId ||
                !this.gameService.getGame(gameId)) {
                socket.destroy();
                return;
            }
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request, gameId);
            });
        });
    }
    registerConnections() {
        this.wss.on('connection', (ws, _request, gameId) => {
            let connections = this.connections.get(gameId);
            if (!connections) {
                connections = new Set();
                this.connections.set(gameId, connections);
            }
            connections.add(ws);
            const game = this.gameService.getGame(gameId);
            if (!game) {
                ws.close();
                return;
            }
            ws.send(JSON.stringify({
                type: 'connected',
                gameId,
            }));
            ws.on('message', (data) => {
                this.handleMessage(ws, gameId, data.toString());
            });
            ws.on('close', () => {
                connections?.delete(ws);
                if (connections?.size === 0) {
                    this.connections.delete(gameId);
                }
            });
        });
    }
    handleMessage(ws, gameId, data) {
        let message;
        try {
            message = JSON.parse(data);
        }
        catch {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid JSON',
            }));
            return;
        }
        const game = this.gameService.getGame(gameId);
        if (!game) {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Game not found',
            }));
            return;
        }
        if (message.type === 'state') {
            this.broadcastState(gameId);
        }
    }
    broadcastState(gameId) {
        const game = this.gameService.getGame(gameId);
        if (!game) {
            return;
        }
        this.broadcast(gameId, {
            type: 'state',
            state: game.getState(),
            players: game.getPlayers(),
        });
    }
    broadcast(gameId, message) {
        const connections = this.connections.get(gameId);
        if (!connections) {
            return;
        }
        const data = JSON.stringify(message);
        for (const ws of connections) {
            if (ws.readyState === ws.OPEN) {
                ws.send(data);
            }
        }
    }
}
exports.GameWebSocket = GameWebSocket;
function registerGameWebSocket(app, gameService) {
    new GameWebSocket(app, gameService);
}
