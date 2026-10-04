import type {FastifyInstance} from 'fastify';

import {
    GameService,
} from '../game/game-service';

import type {
    RoundInput,
} from '../game/game-engine';

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
        Body: RoundInput;
    }>('/games/:id/rounds', async (request, reply) => {
        const game = gameService.getGame(request.params.id);

        if (!game) {
            return reply.code(404).send({
                error: 'Game not found',
            });
        }

        const result = game.playRound(request.body);

        return result;
    });
}
