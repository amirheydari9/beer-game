"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGameRoutes = registerGameRoutes;
const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];
const isRole = (value) => {
    return (typeof value === 'string' &&
        ROLES.includes(value));
};
const isNonNegativeInteger = (value) => {
    return (typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0);
};
const isValidRoundInput = (body) => {
    if (typeof body !== 'object' ||
        body === null) {
        return false;
    }
    const input = body;
    if (!isNonNegativeInteger(input['customerDemand'])) {
        return false;
    }
    if (typeof input['orders'] !== 'object' ||
        input['orders'] === null) {
        return false;
    }
    const orders = input['orders'];
    return ROLES.every((role) => isNonNegativeInteger(orders[role]));
};
async function registerGameRoutes(app, gameService) {
    app.get('/games', async () => {
        const games = gameService.listGames();
        return {
            games: games.map((game) => ({
                id: game.id,
                round: game.getState().round,
                players: game.getPlayers(),
            })),
        };
    });
    app.post('/games', async () => {
        const game = gameService.createGame();
        return {
            id: game.id,
            state: game.getState(),
            players: game.getPlayers(),
        };
    });
    app.get('/games/:id', async (request, reply) => {
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
    app.post('/games/:id/join', async (request, reply) => {
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
        gameService.joinPlayer(game.id, role);
        return {
            gameId: game.id,
            role,
            players: game.getPlayers(),
        };
    });
    app.post('/games/:id/orders', async (request, reply) => {
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
        const result = gameService.placeOrder(game.id, role, quantity);
        if (!result.round) {
            return {
                gameId: game.id,
                role,
                quantity,
                orders: result.game.getPendingOrders(),
                allOrdersPlaced: false,
            };
        }
        return {
            gameId: game.id,
            role,
            quantity,
            allOrdersPlaced: true,
            round: result.round,
        };
    });
    app.post('/games/:id/rounds', async (request, reply) => {
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
