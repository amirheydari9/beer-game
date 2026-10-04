import {describe, expect, it} from 'vitest';

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
});
