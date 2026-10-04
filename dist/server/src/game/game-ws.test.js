"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const ws_1 = __importDefault(require("ws"));
const game_service_1 = require("./game-service");
const game_ws_1 = require("./game-ws");
const game_routes_1 = require("../http/game-routes");
(0, vitest_1.describe)('GameWebSocket', () => {
    const app = (0, fastify_1.default)();
    const gameService = new game_service_1.GameService();
    let gameWs;
    let port;
    (0, vitest_1.beforeAll)(async () => {
        await (0, game_routes_1.registerGameRoutes)(app, gameService);
        gameWs = new game_ws_1.GameWebSocket(app, gameService);
        await app.listen({
            host: '127.0.0.1',
            port: 0,
        });
        const address = app.server.address();
        if (!address || typeof address === 'string') {
            throw new Error('Could not determine server port');
        }
        port = address.port;
    });
    (0, vitest_1.afterAll)(async () => {
        await app.close();
    });
    const connect = async (gameId) => {
        const ws = new ws_1.default(`ws://127.0.0.1:${port}/games/${gameId}/ws`);
        const messages = [];
        ws.on('message', (data) => {
            messages.push(JSON.parse(data.toString()));
        });
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });
        await new Promise((resolve) => {
            setTimeout(resolve, 20);
        });
        return {
            ws,
            messages,
        };
    };
    const waitForMessages = async () => {
        await new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
    (0, vitest_1.it)('connects to a game websocket', async () => {
        const game = gameService.createGame();
        const { ws, messages } = await connect(game.id);
        (0, vitest_1.expect)(messages).toContainEqual({
            type: 'connected',
            gameId: game.id,
        });
        ws.close();
    });
    (0, vitest_1.it)('broadcasts when a player joins', async () => {
        const game = gameService.createGame();
        const { ws, messages } = await connect(game.id);
        messages.length = 0;
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        await waitForMessages();
        (0, vitest_1.expect)(messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });
        ws.close();
    });
    (0, vitest_1.it)('broadcasts when an order is placed', async () => {
        const game = gameService.createGame();
        const { ws, messages } = await connect(game.id);
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
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        await waitForMessages();
        (0, vitest_1.expect)(messages).toContainEqual({
            type: 'order-placed',
            state: game.getState(),
            players: ['retailer'],
            orders: {
                retailer: 4,
            },
        });
        ws.close();
    });
    (0, vitest_1.it)('broadcasts the new state after all players place orders', async () => {
        const game = gameService.createGame();
        const { ws, messages } = await connect(game.id);
        const roles = [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ];
        for (const role of roles) {
            const response = await app.inject({
                method: 'POST',
                url: `/games/${game.id}/join`,
                payload: {
                    role,
                },
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            await waitForMessages();
        }
        (0, vitest_1.expect)(game.getState().round).toBe(1);
        (0, vitest_1.expect)(messages).toContainEqual({
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
    (0, vitest_1.it)('broadcasts to all connected clients', async () => {
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
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        await waitForMessages();
        (0, vitest_1.expect)(clientA.messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });
        (0, vitest_1.expect)(clientB.messages).toContainEqual({
            type: 'player-joined',
            state: game.getState(),
            players: ['retailer'],
        });
        clientA.ws.close();
        clientB.ws.close();
    });
    (0, vitest_1.it)('rejects websocket connection for an unknown game', async () => {
        const ws = new ws_1.default(`ws://127.0.0.1:${port}/games/unknown-game/ws`);
        const result = await new Promise((resolve) => {
            ws.once('open', () => resolve('open'));
            ws.once('error', () => resolve('error'));
            ws.once('close', () => resolve('close'));
        });
        (0, vitest_1.expect)(result).not.toBe('open');
        ws.close();
    });
});
