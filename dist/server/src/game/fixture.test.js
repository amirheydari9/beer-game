"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const everyone_orders_four_json_1 = __importDefault(require("../../../fixtures/everyone-orders-four.json"));
const vitest_1 = require("vitest");
const game_engine_1 = require("./game-engine");
const createInitialState = () => ({
    round: 0,
    players: {
        retailer: {
            role: 'retailer',
            inventory: everyone_orders_four_json_1.default.initial.inventory,
            backlog: everyone_orders_four_json_1.default.initial.backlog,
            shipmentsInTransit: [...everyone_orders_four_json_1.default.initial.shipmentsInTransit],
            lastOrderPlaced: everyone_orders_four_json_1.default.initial.lastOrderPlaced,
            totalCost: 0,
            joined: false
        },
        wholesaler: {
            role: 'wholesaler',
            inventory: everyone_orders_four_json_1.default.initial.inventory,
            backlog: everyone_orders_four_json_1.default.initial.backlog,
            shipmentsInTransit: [...everyone_orders_four_json_1.default.initial.shipmentsInTransit],
            lastOrderPlaced: everyone_orders_four_json_1.default.initial.lastOrderPlaced,
            totalCost: 0,
            joined: false
        },
        distributor: {
            role: 'distributor',
            inventory: everyone_orders_four_json_1.default.initial.inventory,
            backlog: everyone_orders_four_json_1.default.initial.backlog,
            shipmentsInTransit: [...everyone_orders_four_json_1.default.initial.shipmentsInTransit],
            lastOrderPlaced: everyone_orders_four_json_1.default.initial.lastOrderPlaced,
            totalCost: 0,
            joined: false
        },
        factory: {
            role: 'factory',
            inventory: everyone_orders_four_json_1.default.initial.inventory,
            backlog: everyone_orders_four_json_1.default.initial.backlog,
            shipmentsInTransit: [...everyone_orders_four_json_1.default.initial.shipmentsInTransit],
            lastOrderPlaced: everyone_orders_four_json_1.default.initial.lastOrderPlaced,
            totalCost: 0,
            joined: false
        },
    },
});
const createOrders = () => ({
    retailer: 4,
    wholesaler: 4,
    distributor: 4,
    factory: 4,
});
(0, vitest_1.describe)('GameEngine / fixture', () => {
    (0, vitest_1.it)('loads fixture correctly', () => {
        (0, vitest_1.expect)(everyone_orders_four_json_1.default).toBeDefined();
        (0, vitest_1.expect)(everyone_orders_four_json_1.default.initial).toBeDefined();
        (0, vitest_1.expect)(everyone_orders_four_json_1.default.rounds).toHaveLength(20);
    });
    (0, vitest_1.it)('matches every fixture round', () => {
        const engine = new game_engine_1.GameEngine(createInitialState());
        for (const expectedRound of everyone_orders_four_json_1.default.rounds) {
            const round = expectedRound.round;
            const customerDemand = round <= 4
                ? 4
                : 8;
            const result = engine.playRound({
                orders: createOrders(),
                customerDemand,
            });
            (0, vitest_1.expect)(result.round).toBe(round);
            for (const role of [
                'retailer',
                'wholesaler',
                'distributor',
                'factory',
            ]) {
                const expected = expectedRound[role];
                const actual = result.players[role];
                (0, vitest_1.expect)(actual.shipped).toBe(expected.shipped);
                (0, vitest_1.expect)(actual.inventory).toBe(expected.inventory);
                (0, vitest_1.expect)(actual.backlog).toBe(expected.backlog);
                (0, vitest_1.expect)(actual.roundCost).toBe(expected.roundCost);
                (0, vitest_1.expect)(actual.totalCost).toBe(expected.totalCost);
                (0, vitest_1.expect)(actual.orderPlaced).toBe(expected.orderPlaced);
            }
        }
    });
});
