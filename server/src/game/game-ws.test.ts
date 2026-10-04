import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import Fastify from 'fastify';
import WebSocket from 'ws';

import {GameService} from './game-service';
import {GameWebSocket} from './game-ws';
import {registerGameRoutes} from '../http/game-routes';

describe('GameWebSocket', () => {
    const app = Fastify();
    const gameService = new GameService();

    let gameWs: GameWebSocket;
    let port: number;

    beforeAll(async () => {
        await registerGameRoutes(
            app,
            gameService,
        );

        gameWs = new GameWebSocket(
            app,
            gameService,
        );

        await app.listen({
            host: '127.0.0.1',
            port: 0,
        });

        const address = app.server.address();

        if (!address || typeof address === 'string') {
            throw new Error(
                'Could not determine server port',
            );
        }

        port = address.port;
    });

    afterAll(async () => {
        await app.close();
    });

    const connect = async (
        gameId: string,
    ): Promise<{
        ws: WebSocket;
        messages: unknown[];
    }> => {
        const ws = new WebSocket(
            `ws://127.0.0.1:${port}/games/${gameId}/ws`,
        );

        const messages: unknown[] = [];

        ws.on('message', (data) => {
            messages.push(
                JSON.parse(data.toString()),
            );
        });

        await new Promise<void>((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });

        await new Promise<void>((resolve) => {
            setTimeout(resolve, 20);
        });

        return {
            ws,
            messages,
        };
    };

    const waitForMessages = async (): Promise<void> => {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 50);
        });
    };

    it('connects to a game websocket', async () => {
        const game = gameService.createGame();

        const {ws, messages} = await connect(game.id);

        expect(messages).toContainEqual({
            type: 'connected',
            gameId: game.id,
        });

        ws.close();
    });

    it('broadcasts when a player joins', async () => {
        const game = gameService.createGame();

        const {ws, messages} = await connect(game.id);

        messages.length = 0;

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });

        expect(response.statusCode).toBe(200);

        await waitForMessages();

        expect(messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });

        ws.close();
    });

    it('broadcasts when an order is placed', async () => {
        const game = gameService.createGame();

        const {ws, messages} = await connect(game.id);

        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });

        await waitForMessages();

        messages.length = 0;

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 4,
            },
        });

        expect(response.statusCode).toBe(200);

        await waitForMessages();

        expect(messages).toContainEqual({
            type: 'order-placed',
            state: game.getState(),
            players: ['retailer'],
            orders: {
                retailer: 4,
            },
        });

        ws.close();
    });

    it('broadcasts the new state after all players place orders', async () => {
        const game = gameService.createGame();

        const {ws, messages} = await connect(game.id);

        const roles = [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ] as const;

        for (const role of roles) {
            const response = await app.inject({
                method: 'POST',
                url: `/games/${game.id}/join`,
                payload: {
                    role,
                },
            });

            expect(response.statusCode).toBe(200);

            await waitForMessages();
        }

        messages.length = 0;

        for (const role of roles) {
            const response = await app.inject({
                method: 'POST',
                url: `/games/${game.id}/orders`,
                payload: {
                    role,
                    quantity: 4,
                },
            });

            expect(response.statusCode).toBe(200);

            await waitForMessages();
        }

        expect(game.getState().round).toBe(1);

        expect(messages).toContainEqual({
            type: 'round-played',
            state: game.getState(),
            players: [
                'retailer',
                'wholesaler',
                'distributor',
                'factory',
            ],
        });

        ws.close();
    });

    it('broadcasts to all connected clients', async () => {
        const game = gameService.createGame();

        const clientA = await connect(game.id);
        const clientB = await connect(game.id);

        clientA.messages.length = 0;
        clientB.messages.length = 0;

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });

        expect(response.statusCode).toBe(200);

        await waitForMessages();

        expect(clientA.messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });

        expect(clientB.messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });

        clientA.ws.close();
        clientB.ws.close();
    });

    it('rejects websocket connection for an unknown game', async () => {
        const ws = new WebSocket(
            `ws://127.0.0.1:${port}/games/unknown-game/ws`,
        );

        const result = await new Promise<
            'open' | 'error' | 'close'
        >((resolve) => {
            ws.once('open', () => resolve('open'));
            ws.once('error', () => resolve('error'));
            ws.once('close', () => resolve('close'));
        });

        expect(result).not.toBe('open');

        ws.close();
    });
});
