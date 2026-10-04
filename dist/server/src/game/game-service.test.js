"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const database_1 = require("../db/database");
const game_service_1 = require("./game-service");
(0, vitest_1.describe)('GameService', () => {
    (0, vitest_1.it)('creates a new game', () => {
        const service = new game_service_1.GameService();
        const game = service.createGame();
        (0, vitest_1.expect)(game.id).toBeTypeOf('string');
        (0, vitest_1.expect)(game.getState().round).toBe(0);
    });
    (0, vitest_1.it)('can retrieve a created game', () => {
        const service = new game_service_1.GameService();
        const game = service.createGame();
        (0, vitest_1.expect)(service.getGame(game.id)).toBe(game);
    });
    (0, vitest_1.it)('returns undefined for an unknown game', () => {
        const service = new game_service_1.GameService();
        (0, vitest_1.expect)(service.getGame('unknown')).toBeUndefined();
    });
    (0, vitest_1.it)('deletes a game', () => {
        const service = new game_service_1.GameService();
        const game = service.createGame();
        (0, vitest_1.expect)(service.deleteGame(game.id)).toBe(true);
        (0, vitest_1.expect)(service.getGame(game.id)).toBeUndefined();
    });
    (0, vitest_1.it)('creates independent games', () => {
        const service = new game_service_1.GameService();
        const first = service.createGame();
        const second = service.createGame();
        (0, vitest_1.expect)(first.id).not.toBe(second.id);
        (0, vitest_1.expect)(first).not.toBe(second);
    });
    (0, vitest_1.it)('persists joined players', () => {
        const database = new database_1.AppDatabase(':memory:');
        const service = new game_service_1.GameService(database);
        const game = service.createGame();
        service.joinPlayer(game.id, 'retailer');
        const reloadedService = new game_service_1.GameService(database);
        const reloadedGame = reloadedService.getGame(game.id);
        (0, vitest_1.expect)(reloadedGame).toBeDefined();
        (0, vitest_1.expect)(reloadedGame?.getState().players.retailer.joined).toBe(true);
        (0, vitest_1.expect)(reloadedGame?.hasPlayer('retailer')).toBe(true);
        database.close();
    });
});
