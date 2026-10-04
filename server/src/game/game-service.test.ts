import {describe, expect, it} from 'vitest';
import {AppDatabase} from '../db/database';
import {GameService} from './game-service';

describe('GameService', () => {
    it('creates a new game', () => {
        const service = new GameService();

        const game = service.createGame();

        expect(game.id).toBeTypeOf('string');
        expect(game.getState().round).toBe(0);
    });

    it('can retrieve a created game', () => {
        const service = new GameService();

        const game = service.createGame();

        expect(service.getGame(game.id)).toBe(game);
    });

    it('returns undefined for an unknown game', () => {
        const service = new GameService();

        expect(service.getGame('unknown')).toBeUndefined();
    });

    it('deletes a game', () => {
        const service = new GameService();

        const game = service.createGame();

        expect(service.deleteGame(game.id)).toBe(true);
        expect(service.getGame(game.id)).toBeUndefined();
    });

    it('creates independent games', () => {
        const service = new GameService();

        const first = service.createGame();
        const second = service.createGame();

        expect(first.id).not.toBe(second.id);
        expect(first).not.toBe(second);
    });

    it('persists joined players', () => {
        const database = new AppDatabase(':memory:');

        const service = new GameService(database);

        const game = service.createGame();

        service.joinPlayer(
            game.id,
            'retailer',
        );

        const reloadedService =
            new GameService(database);

        const reloadedGame =
            reloadedService.getGame(game.id);

        expect(reloadedGame).toBeDefined();

        expect(
            reloadedGame?.getState().players.retailer.joined,
        ).toBe(true);

        expect(
            reloadedGame?.hasPlayer('retailer'),
        ).toBe(true);

        database.close();
    });});
