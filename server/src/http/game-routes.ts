import type {FastifyInstance} from 'fastify';

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
