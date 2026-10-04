import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import Fastify from 'fastify';

import {GameService} from '../game/game-service';
import {registerGameRoutes} from './game-routes';

describe('Game routes', () => {
    let app: ReturnType<typeof Fastify>;
    let gameService: GameService;

    beforeEach(async () => {
        app = Fastify();
        gameService = new GameService();

        await registerGameRoutes(
            app,
            gameService,
        );
    });

    afterEach(async () => {
        await app.close();
    });

    it('creates a game', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/games',
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.id).toEqual(
            expect.any(String),
        );

        expect(body.state.round).toBe(0);

        expect(body.players).toEqual([]);
    });

    it('gets an existing game', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

        const response = await app.inject({
            method: 'GET',
            url: `/games/${game.id}`,
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.id).toBe(game.id);
        expect(body.state.round).toBe(0);
        expect(body.players).toEqual([]);
    });

    it('returns 404 for an unknown game', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/games/unknown',
        });

        expect(response.statusCode).toBe(404);

        expect(response.json()).toEqual({
            error: 'Game not found',
        });
    });

    it('allows a player to join', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'retailer',
            },
        });

        expect(response.statusCode).toBe(200);

        expect(response.json()).toEqual({
            gameId: game.id,
            role: 'retailer',
            players: ['retailer'],
        });
    });

    it('rejects an invalid role', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/join`,
            payload: {
                role: 'invalid',
            },
        });

        expect(response.statusCode).toBe(400);

        expect(response.json()).toEqual({
            error: 'Invalid role',
        });
    });

    it('rejects a duplicate role', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

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

        expect(response.statusCode).toBe(409);

        expect(response.json()).toEqual({
            error: 'Role already joined',
        });
    });

    it('places an order', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

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

        expect(response.statusCode).toBe(200);

        expect(response.json()).toEqual({
            gameId: game.id,
            role: 'retailer',
            quantity: 4,
            orders: {
                retailer: 4,
            },
            allOrdersPlaced: false,
        });
    });

    it('executes a round after all four orders are placed', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

        const roles = [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ] as const;

        for (const role of roles) {
            const joinResponse =
                await app.inject({
                    method: 'POST',
                    url: `/games/${game.id}/join`,
                    payload: {
                        role,
                    },
                });

            expect(
                joinResponse.statusCode,
            ).toBe(200);
        }

        for (const role of roles) {
            const response =
                await app.inject({
                    method: 'POST',
                    url: `/games/${game.id}/orders`,
                    payload: {
                        role,
                        quantity: 4,
                    },
                });

            expect(
                response.statusCode,
            ).toBe(200);
        }

        const storedGame =
            gameService.getGame(game.id);

        expect(storedGame).toBeDefined();

        expect(
            storedGame?.getState().round,
        ).toBe(1);
    });

    it('rejects an invalid order quantity', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

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

        expect(response.statusCode).toBe(400);

        expect(response.json()).toEqual({
            error: 'Invalid order quantity',
        });
    });

    it('rejects an order from a player who has not joined', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

        const response = await app.inject({
            method: 'POST',
            url: `/games/${game.id}/orders`,
            payload: {
                role: 'retailer',
                quantity: 4,
            },
        });

        expect(response.statusCode).toBe(400);

        expect(response.json()).toEqual({
            error: 'Player has not joined the game',
        });
    });

    it('rejects a duplicate order in the same round', async () => {
        const createResponse =
            await app.inject({
                method: 'POST',
                url: '/games',
            });

        const game =
            createResponse.json();

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

        expect(response.statusCode).toBe(409);

        expect(response.json()).toEqual({
            error: 'Order already placed for this round',
        });
    });
});
