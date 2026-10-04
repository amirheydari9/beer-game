import type {FastifyInstance} from 'fastify';
import type {IncomingMessage} from 'node:http';
import {WebSocketServer, type WebSocket} from 'ws';

import {GameService} from './game-service';

interface ClientMessage {
    type: string;
}

export class GameWebSocket {
    private readonly wss = new WebSocketServer({
        noServer: true,
    });

    private readonly connections = new Map<
        string,
        Set<WebSocket>
    >();

    constructor(
        private readonly app: FastifyInstance,
        private readonly gameService: GameService,
    ) {
        this.registerUpgrade();
        this.registerConnections();
    }

    private registerUpgrade(): void {
        this.app.server.on(
            'upgrade',
            (request, socket, head) => {
                const url = new URL(
                    request.url ?? '/',
                    'http://localhost',
                );

                const match = url.pathname.match(
                    /^\/games\/([^/]+)\/ws$/,
                );

                if (!match) {
                    return;
                }

                const gameId = match[1];

                if (
                    !gameId ||
                    !this.gameService.getGame(gameId)
                ) {
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(
                    request,
                    socket,
                    head,
                    (ws) => {
                        this.wss.emit(
                            'connection',
                            ws,
                            request,
                            gameId,
                        );
                    },
                );
            },
        );
    }

    private registerConnections(): void {
        this.wss.on(
            'connection',
            (
                ws: WebSocket,
                _request: IncomingMessage,
                gameId: string,
            ) => {
                let connections =
                    this.connections.get(gameId);

                if (!connections) {
                    connections = new Set<WebSocket>();
                    this.connections.set(
                        gameId,
                        connections,
                    );
                }

                connections.add(ws);

                const game =
                    this.gameService.getGame(gameId);

                if (!game) {
                    ws.close();
                    return;
                }

                ws.send(
                    JSON.stringify({
                        type: 'connected',
                        gameId,
                    }),
                );

                ws.on('message', (data) => {
                    this.handleMessage(
                        ws,
                        gameId,
                        data.toString(),
                    );
                });

                ws.on('close', () => {
                    connections?.delete(ws);

                    if (
                        connections?.size === 0
                    ) {
                        this.connections.delete(
                            gameId,
                        );
                    }
                });
            },
        );
    }

    private handleMessage(
        ws: WebSocket,
        gameId: string,
        data: string,
    ): void {
        let message: ClientMessage;

        try {
            message = JSON.parse(data) as ClientMessage;
        } catch {
            ws.send(
                JSON.stringify({
                    type: 'error',
                    error: 'Invalid JSON',
                }),
            );

            return;
        }

        const game =
            this.gameService.getGame(gameId);

        if (!game) {
            ws.send(
                JSON.stringify({
                    type: 'error',
                    error: 'Game not found',
                }),
            );

            return;
        }

        if (message.type === 'state') {
            this.broadcastState(gameId);
        }
    }

    broadcastState(gameId: string): void {
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

    broadcast(
        gameId: string,
        message: unknown,
    ): void {
        const connections =
            this.connections.get(gameId);

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

export function registerGameWebSocket(
    app: FastifyInstance,
    gameService: GameService,
): void {
    new GameWebSocket(
        app,
        gameService,
    );
}
