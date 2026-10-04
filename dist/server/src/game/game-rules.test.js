"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const game_engine_1 = require("./game-engine");
const createInitialState = () => ({
    round: 0,
    players: {
        retailer: {
            role: 'retailer',
            joined: false,
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        wholesaler: {
            role: 'wholesaler',
            joined: false,
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        distributor: {
            role: 'distributor',
            joined: false,
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
        factory: {
            role: 'factory',
            joined: false,
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
        },
    },
});
const createOrders = (retailer = 4, wholesaler = 4, distributor = 4, factory = 4) => ({
    retailer,
    wholesaler,
    distributor,
    factory,
});
(0, vitest_1.describe)('GameEngine', () => {
    (0, vitest_1.it)('plays round 1 correctly', () => {
        const engine = new game_engine_1.GameEngine(createInitialState());
        const result = engine.playRound({
            orders: createOrders(),
            customerDemand: 4,
        });
        (0, vitest_1.expect)(result.round).toBe(1);
        for (const role of [
            'retailer',
            'wholesaler',
            'distributor',
            'factory',
        ]) {
            (0, vitest_1.expect)(result.players[role]).toEqual({
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
    (0, vitest_1.it)('keeps upstream orders one round behind', () => {
        const engine = new game_engine_1.GameEngine(createInitialState());
        const result = engine.playRound({
            orders: createOrders(8),
            customerDemand: 8,
        });
        (0, vitest_1.expect)(result.players.retailer.orderPlaced).toBe(8);
        (0, vitest_1.expect)(result.players.wholesaler.incomingOrder).toBe(4);
    });
    (0, vitest_1.it)('uses actual shipped quantity for incoming shipments', () => {
        const initialState = createInitialState();
        initialState.players.wholesaler.inventory = 0;
        initialState.players.wholesaler.shipmentsInTransit = [0, 0];
        const engine = new game_engine_1.GameEngine(initialState);
        const result = engine.playRound({
            orders: createOrders(),
            customerDemand: 4,
        });
        (0, vitest_1.expect)(result.players.wholesaler.shipped).toBe(0);
        const state = engine.getState();
        (0, vitest_1.expect)(state.players.retailer.shipmentsInTransit).toEqual([4, 0]);
    });
    (0, vitest_1.it)('matches the fixture final state when everyone orders four', () => {
        const engine = new game_engine_1.GameEngine(createInitialState());
        for (let round = 1; round <= 20; round++) {
            engine.playRound({
                orders: createOrders(),
                customerDemand: round <= 4 ? 4 : 8,
            });
        }
        const state = engine.getState();
        (0, vitest_1.expect)(state.round).toBe(20);
        (0, vitest_1.expect)(state.players.retailer.inventory).toBe(0);
        (0, vitest_1.expect)(state.players.retailer.backlog).toBe(52);
        (0, vitest_1.expect)(state.players.retailer.totalCost).toBe(394);
        (0, vitest_1.expect)(state.players.wholesaler.inventory).toBe(12);
        (0, vitest_1.expect)(state.players.wholesaler.backlog).toBe(0);
        (0, vitest_1.expect)(state.players.wholesaler.totalCost).toBe(120);
        (0, vitest_1.expect)(state.players.distributor.inventory).toBe(12);
        (0, vitest_1.expect)(state.players.distributor.backlog).toBe(0);
        (0, vitest_1.expect)(state.players.distributor.totalCost).toBe(120);
        (0, vitest_1.expect)(state.players.factory.inventory).toBe(12);
        (0, vitest_1.expect)(state.players.factory.backlog).toBe(0);
        (0, vitest_1.expect)(state.players.factory.totalCost).toBe(120);
    });
});
