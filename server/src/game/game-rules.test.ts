import {describe, expect, it} from 'vitest';

import {GameEngine, type RoundInput} from './game-engine';
import type {GameState} from './game-state';

const createInitialState = (): GameState => ({
    round: 0,
    players: {
        retailer: {
            role: 'retailer',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        wholesaler: {
            role: 'wholesaler',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        distributor: {
            role: 'distributor',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        factory: {
            role: 'factory',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
    },
});

const createOrders = (
    retailer = 4,
    wholesaler = 4,
    distributor = 4,
    factory = 4,
): RoundInput['orders'] => ({
    retailer,
    wholesaler,
    distributor,
    factory,
});

describe('GameEngine', () => {

    it('plays round 1 correctly', () => {
        const engine = new GameEngine(createInitialState());

        const result = engine.playRound({
            orders: createOrders(),
            customerDemand: 4,
        });

        expect(result.round).toBe(1);

        for (const role of [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ] as const) {
            expect(result.players[role]).toEqual({
                role,
                incomingOrder: 4,
                shipped: 4,
                inventory: 12,
                backlog: 0,
                roundCost: 6,
                orderPlaced: 4,
                totalCost: 6,
            });
        }
    });

    it('keeps upstream orders one round behind', () => {
        const engine = new GameEngine(createInitialState());

        const result = engine.playRound({
            orders: createOrders(8),
            customerDemand: 8,
        });

        expect(result.players.retailer.orderPlaced).toBe(8);

        expect(result.players.wholesaler.incomingOrder).toBe(4);
    });

    it('uses actual shipped quantity for incoming shipments', () => {
        const initialState = createInitialState();

        initialState.players.wholesaler.inventory = 0;
        initialState.players.wholesaler.shipmentsInTransit = [0, 0];

        const engine = new GameEngine(initialState);

        const result = engine.playRound({
            orders: createOrders(),
            customerDemand: 4,
        });

        expect(result.players.wholesaler.shipped).toBe(0);

        const state = engine.getState();

        expect(
            state.players.retailer.shipmentsInTransit,
        ).toEqual([4, 0]);
    });


});
