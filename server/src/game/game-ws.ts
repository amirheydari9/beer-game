import type {FastifyInstance} from 'fastify';
import {WebSocketServer, type WebSocket} from 'ws';

import {GameService} from '../game/game-service';

interface ClientMessage {
    type: string;
    role?: string;
}

export function registerGameWebSocket(
    app: FastifyInstance,
    gameService: GameService,
): void {
    const wss = new WebSocketServer({
        noServer: true,
    });

    app.server.on('upgrade', (request, socket, head) => {
        const url = new URL(
            request.url ?? '',
            `http://${request.headers.host}`,
        );

        const match = url.pathname.match(
            /^\/games\/([^/]+)\/ws$/,
        );

        if (!match) {
            socket.destroy();
            return;
        }

        const gameId = match[1];

        if (!gameId || !gameService.getGame(gameId)) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(
            request,
            socket,
            head,
            (ws) => {
                wss.emit(
                    'connection',
                    ws,
                    request,
                    gameId,
                );
            },
        );
    });

    wss.on(
        'connection',
        (
            ws: WebSocket,
            _request: import('http').IncomingMessage,
            gameId: string,
        ) => {
            ws.send(
                JSON.stringify({
                    type: 'connected',
                    gameId,
                }),
            );

            ws.on('message', (data) => {
                let message: ClientMessage;

                try {
                    message = JSON.parse(
                        data.toString(),
                    ) as ClientMessage;
                } catch {
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            error: 'Invalid JSON',
                        }),
                    );

                    return;
                }

                if (message.type === 'state') {
                    const game =
                        gameService.getGame(gameId);

                    if (!game) {
                        ws.send(
                            JSON.stringify({
                                type: 'error',
                                error: 'Game not found',
                            }),
                        );

                        return;
                    }

                    ws.send(
                        JSON.stringify({
                            type: 'state',
                            state: game.getState(),
                            players: game.getPlayers(),
                        }),
                    );
                }
            });
        },
    );
}
