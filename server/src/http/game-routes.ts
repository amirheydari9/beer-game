import type {FastifyInstance} from 'fastify';

import type {Role} from '@shared/types';

import {
    GameService,
} from '../game/game-service';

import type {
    RoundInput,
} from '../game/game-engine';

const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
] as const;

const isRole = (
    value: unknown,
): value is Role => {
    return (
        typeof value === 'string' &&
        ROLES.includes(value as Role)
    );
};

const isNonNegativeInteger = (
    value: unknown,
): value is number => {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0
    );
};

const isValidRoundInput = (
    body: unknown,
): body is RoundInput => {
    if (
        typeof body !== 'object' ||
        body === null
    ) {
        return false;
    }

    const input = body as Record<string, unknown>;

    if (!isNonNegativeInteger(input['customerDemand'])) {
        return false;
    }

    if (
        typeof input['orders'] !== 'object' ||
        input['orders'] === null
    ) {
        return false;
    }

    const orders = input['orders'] as Record<
        string,
        unknown
    >;

    return ROLES.every((role) =>
        isNonNegativeInteger(orders[role]),
    );
};

export async function registerGameRoutes(
    app: FastifyInstance,
    gameService: GameService,
): Promise<void> {
    app.post('/games', async () => {
        const game = gameService.createGame();

        return {
            id: game.id,
            state: game.getState(),
            players: game.getPlayers(),
        };
    });

    app.get<{
        Params: {
            id: string;
        };
    }>('/games/:id', async (request, reply) => {
        const game = gameService.getGame(request.params.id);

        if (!game) {
            return reply.code(404).send({
                error: 'Game not found',
            });
        }

        return {
            id: game.id,
            state: game.getState(),
            players: game.getPlayers(),
        };
    });

    app.post<{
        Params: {
            id: string;
        };
        Body: {
            role: unknown;
        };
    }>('/games/:id/join', async (request, reply) => {
        const game = gameService.getGame(request.params.id);

        if (!game) {
            return reply.code(404).send({
                error: 'Game not found',
            });
        }

        const role = request.body?.role;

        if (!isRole(role)) {
            return reply.code(400).send({
                error: 'Invalid role',
            });
        }

        if (game.hasPlayer(role)) {
            return reply.code(409).send({
                error: 'Role already joined',
            });
        }

        game.join(role);

        return {
            gameId: game.id,
            role,
            players: game.getPlayers(),
        };
    });


    app.post<{
        Params: {
            id: string;
        };
        Body: {
            role: unknown;
            quantity: unknown;
        };
    }>('/games/:id/orders', async (request, reply) => {
        const game = gameService.getGame(request.params.id);

        if (!game) {
            return reply.code(404).send({
                error: 'Game not found',
            });
        }

        const role = request.body?.role;
        const quantity = request.body?.quantity;

        if (!isRole(role)) {
            return reply.code(400).send({
                error: 'Invalid role',
            });
        }

        if (!isNonNegativeInteger(quantity)) {
            return reply.code(400).send({
                error: 'Invalid order quantity',
            });
        }

        if (!game.hasPlayer(role)) {
            return reply.code(400).send({
                error: 'Player has not joined the game',
            });
        }

        if (game.hasOrder(role)) {
            return reply.code(409).send({
                error: 'Order already placed for this round',
            });
        }

        game.placeOrder(role, quantity);

        if (!game.hasAllOrders()) {
            return {
                gameId: game.id,
                role,
                quantity,
                orders: game.getPendingOrders(),
                allOrdersPlaced: false,
            };
        }

        const result = game.playPendingRound(
            game.getState().round < 4 ? 4 : 8,
        );

        return {
            gameId: game.id,
            role,
            quantity,
            allOrdersPlaced: true,
            round: result,
        };
    });


    app.post<{
        Params: {
            id: string;
        };
        Body: unknown;
    }>('/games/:id/rounds', async (request, reply) => {
        const game = gameService.getGame(request.params.id);

        if (!game) {
            return reply.code(404).send({
                error: 'Game not found',
            });
        }

        if (!isValidRoundInput(request.body)) {
            return reply.code(400).send({
                error: 'Invalid round input',
            });
        }

        const result = game.playRound(request.body);

        return result;
    });
}
