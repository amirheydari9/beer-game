"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const database_1 = require("./database");
const game_repository_1 = require("./game-repository");
const createState = () => ({
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
(0, vitest_1.describe)('GameRepository', () => {
    let database;
    (0, vitest_1.afterEach)(() => {
        database?.close();
    });
    (0, vitest_1.it)('saves and loads a game state', () => {
        database = new database_1.AppDatabase(':memory:');
        const repository = new game_repository_1.GameRepository(database);
        const state = createState();
        repository.save('game-1', state);
        (0, vitest_1.expect)(repository.findById('game-1')).toEqual(state);
    });
    (0, vitest_1.it)('updates an existing game state', () => {
        database = new database_1.AppDatabase(':memory:');
        const repository = new game_repository_1.GameRepository(database);
        const state = createState();
        repository.save('game-1', state);
        const updatedState = {
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
        repository.save('game-1', updatedState);
        (0, vitest_1.expect)(repository.findById('game-1')).toEqual(updatedState);
    });
    (0, vitest_1.it)('returns undefined for an unknown game', () => {
        database = new database_1.AppDatabase(':memory:');
        const repository = new game_repository_1.GameRepository(database);
        (0, vitest_1.expect)(repository.findById('unknown')).toBeUndefined();
    });
    (0, vitest_1.it)('deletes a game', () => {
        database = new database_1.AppDatabase(':memory:');
        const repository = new game_repository_1.GameRepository(database);
        repository.save('game-1', createState());
        (0, vitest_1.expect)(repository.delete('game-1')).toBe(true);
        (0, vitest_1.expect)(repository.findById('game-1')).toBeUndefined();
    });
    (0, vitest_1.it)('returns false when deleting an unknown game', () => {
        database = new database_1.AppDatabase(':memory:');
        const repository = new game_repository_1.GameRepository(database);
        (0, vitest_1.expect)(repository.delete('unknown')).toBe(false);
    });
});
