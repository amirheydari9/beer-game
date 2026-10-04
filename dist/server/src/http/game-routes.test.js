"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const game_service_1 = require("../game/game-service");
const game_routes_1 = require("./game-routes");
(0, vitest_1.describe)('Game routes', () => {
    let app;
    let gameService;
    (0, vitest_1.beforeEach)(async () => {
        app = (0, fastify_1.default)();
        gameService = new game_service_1.GameService();
        await (0, game_routes_1.registerGameRoutes)(app, gameService);
    });
    (0, vitest_1.afterEach)(async () => {
        await app.close();
    });
    (0, vitest_1.it)('creates a game', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/games',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.id).toEqual(vitest_1.expect.any(String));
        (0, vitest_1.expect)(body.state.round).toBe(0);
        (0, vitest_1.expect)(body.players).toEqual([]);
    });
    (0, vitest_1.it)('gets an existing game', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        const response = await app.inject({
            method: 'GET',
            url: `/games/${game.id}`,
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.id).toBe(game.id);
        (0, vitest_1.expect)(body.state.round).toBe(0);
        (0, vitest_1.expect)(body.players).toEqual([]);
    });
    (0, vitest_1.it)('returns 404 for an unknown game', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/games/unknown',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(404);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Game not found',
        });
    });
    (0, vitest_1.it)('allows a player to join', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({
            gameId: game.id,
            role: 'retailer',
            players: ['retailer'],
        });
    });
    (0, vitest_1.it)('rejects an invalid role', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'invalid',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Invalid role',
        });
    });
    (0, vitest_1.it)('rejects a duplicate role', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Role already joined',
        });
    });
    (0, vitest_1.it)('places an order', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 4,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        (0, vitest_1.expect)(response.json()).toEqual({
            gameId: game.id,
            role: 'retailer',
            quantity: 4,
            orders: {
                retailer: 4,
            },
            allOrdersPlaced: false,
        });
    });
    (0, vitest_1.it)('executes a round after all four orders are placed', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        const roles = [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ];
        for (const role of roles) {
            const joinResponse = await app.inject({
                method: 'POST',
                url: `/games/${game.id}/join`,
                payload: {
                    role,
                },
            });
            (0, vitest_1.expect)(joinResponse.statusCode).toBe(200);
        }
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
        }
        const storedGame = gameService.getGame(game.id);
        (0, vitest_1.expect)(storedGame).toBeDefined();
        (0, vitest_1.expect)(storedGame?.getState().round).toBe(1);
    });
    (0, vitest_1.it)('rejects an invalid order quantity', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: -1,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Invalid order quantity',
        });
    });
    (0, vitest_1.it)('rejects an order from a player who has not joined', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 4,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Player has not joined the game',
        });
    });
    (0, vitest_1.it)('rejects a duplicate order in the same round', async () => {
        const createResponse = await app.inject({
            method: 'POST',
            url: '/games',
        });
        const game = createResponse.json();
        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });
        await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 4,
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 6,
            },
        });
        (0, vitest_1.expect)(response.statusCode).toBe(409);
        (0, vitest_1.expect)(response.json()).toEqual({
            error: 'Order already placed for this round',
        });
    });
    (0, vitest_1.it)('lists games', async () => {
        const firstGame = gameService.createGame();
        const secondGame = gameService.createGame();
        const response = await app.inject({
            method: 'GET',
            url: '/games',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = response.json();
        (0, vitest_1.expect)(body.games).toEqual(vitest_1.expect.arrayContaining([
            {
                id: firstGame.id,
                round: 0,
                players: [],
            },
            {
                id: secondGame.id,
                round: 0,
                players: [],
            },
        ]));
    });
});
