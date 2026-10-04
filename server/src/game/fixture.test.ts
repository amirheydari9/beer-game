import fixture from '../../../fixtures/everyone-orders-four.json';

import {describe, expect, it} from 'vitest';

import {GameEngine, type RoundInput} from './game-engine';
import type {GameState} from './game-state';

const createInitialState = (): GameState => ({
    round: 0,
    players: {
        retailer: {
            role: 'retailer',
            inventory: fixture.initial.inventory,
            backlog: fixture.initial.backlog,
            shipmentsInTransit: [...fixture.initial.shipmentsInTransit],
            lastOrderPlaced: fixture.initial.lastOrderPlaced,
            totalCost: 0,
        },
        wholesaler: {
            role: 'wholesaler',
            inventory: fixture.initial.inventory,
            backlog: fixture.initial.backlog,
            shipmentsInTransit: [...fixture.initial.shipmentsInTransit],
            lastOrderPlaced: fixture.initial.lastOrderPlaced,
            totalCost: 0,
        },
        distributor: {
            role: 'distributor',
            inventory: fixture.initial.inventory,
            backlog: fixture.initial.backlog,
            shipmentsInTransit: [...fixture.initial.shipmentsInTransit],
            lastOrderPlaced: fixture.initial.lastOrderPlaced,
            totalCost: 0,
        },
        factory: {
            role: 'factory',
            inventory: fixture.initial.inventory,
            backlog: fixture.initial.backlog,
            shipmentsInTransit: [...fixture.initial.shipmentsInTransit],
            lastOrderPlaced: fixture.initial.lastOrderPlaced,
            totalCost: 0,
        },
    },
});

const createOrders = (): RoundInput['orders'] => ({
    retailer: 4,
    wholesaler: 4,
    distributor: 4,
    factory: 4,
});

describe('GameEngine / fixture', () => {
    it('loads fixture correctly', () => {
        expect(fixture).toBeDefined();
        expect(fixture.initial).toBeDefined();
        expect(fixture.rounds).toHaveLength(20);
    });

    it('matches every fixture round', () => {
        const engine = new GameEngine(createInitialState());

        for (const expectedRound of fixture.rounds) {
            const round = expectedRound.round;

            const customerDemand =
                round <= 4
                    ? 4
                    : 8;

            const result = engine.playRound({
                orders: createOrders(),
                customerDemand,
            });

            expect(result.round).toBe(round);

            for (const role of [
                'retailer',
                'wholesaler',
                'distributor',
                'factory',
            ] as const) {
                const expected = expectedRound[role];
                const actual = result.players[role];

                expect(actual.shipped).toBe(expected.shipped);
                expect(actual.inventory).toBe(expected.inventory);
                expect(actual.backlog).toBe(expected.backlog);
                expect(actual.roundCost).toBe(expected.roundCost);
                expect(actual.totalCost).toBe(expected.totalCost);
                expect(actual.orderPlaced).toBe(expected.orderPlaced);
            }
        }
    });
});
