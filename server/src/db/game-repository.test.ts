import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';

import {AppDatabase} from './database';
import {GameRepository} from './game-repository';
import type {GameState} from '../game/game-state';

const createState = (): GameState => ({
    round: 3,
    players: {
        retailer: {
            role: 'retailer',
            inventory: 10,
            backlog: 2,
            shipmentsInTransit: [4, 6],
            lastOrderPlaced: 5,
            totalCost: 14,
            joined: false,
        },
        wholesaler: {
            role: 'wholesaler',
            inventory: 8,
            backlog: 1,
            shipmentsInTransit: [3, 5],
            lastOrderPlaced: 4,
            totalCost: 20,
            joined: false,
        },
        distributor: {
            role: 'distributor',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 18,
            joined: false,
        },
        factory: {
            role: 'factory',
            inventory: 11,
            backlog: 0,
            shipmentsInTransit: [4, 7],
            lastOrderPlaced: 6,
            totalCost: 21,
            joined: false,
        },
    },
});

describe('GameRepository', () => {
    let database: AppDatabase;

    afterEach(() => {
        database?.close();
    });

    it('saves and loads a game state', () => {
        database = new AppDatabase(':memory:');

        const repository =
            new GameRepository(database);

        const state = createState();

        repository.save(
            'game-1',
            state,
        );

        expect(
            repository.findById('game-1'),
        ).toEqual(state);
    });

    it('updates an existing game state', () => {
        database = new AppDatabase(':memory:');

        const repository =
            new GameRepository(database);

        const state = createState();

        repository.save(
            'game-1',
            state,
        );

        const updatedState: GameState = {
            ...state,
            round: 4,
            players: {
                ...state.players,
                retailer: {
                    ...state.players.retailer,
                    inventory: 6,
                    backlog: 5,
                    totalCost: 30,
                },
            },
        };

        repository.save(
            'game-1',
            updatedState,
        );

        expect(
            repository.findById('game-1'),
        ).toEqual(updatedState);
    });

    it('returns undefined for an unknown game', () => {
        database = new AppDatabase(':memory:');

        const repository =
            new GameRepository(database);

        expect(
            repository.findById('unknown'),
        ).toBeUndefined();
    });

    it('deletes a game', () => {
        database = new AppDatabase(':memory:');

        const repository =
            new GameRepository(database);

        repository.save(
            'game-1',
            createState(),
        );

        expect(
            repository.delete('game-1'),
        ).toBe(true);

        expect(
            repository.findById('game-1'),
        ).toBeUndefined();
    });

    it('returns false when deleting an unknown game', () => {
        database = new AppDatabase(':memory:');

        const repository =
            new GameRepository(database);

        expect(
            repository.delete('unknown'),
        ).toBe(false);
    });
});
