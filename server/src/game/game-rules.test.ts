import {describe, expect, it} from 'vitest';

import {calculatePlayerRound, calculateRoundCost,} from './game-rules';

describe('game-rules', () => {

    describe('calculateRoundCost', () => {

        it('calculates inventory and backlog cost', () => {
            expect(calculateRoundCost(12, 0)).toBe(6);
            expect(calculateRoundCost(8, 0)).toBe(4);
            expect(calculateRoundCost(0, 4)).toBe(4);
            expect(calculateRoundCost(0, 8)).toBe(8);
        });

    });

    describe('calculatePlayerRound', () => {

        it('calculates round 1 from fixture', () => {
            const result = calculatePlayerRound({
                inventory: 12,
                backlog: 0,
                shipmentArrived: 4,
                incomingOrder: 4,
            });

            expect(result).toEqual({
                shipped: 4,
                inventory: 12,
                backlog: 0,
                roundCost: 6,
            });
        });

        it('calculates retailer round 5 from fixture', () => {
            const result = calculatePlayerRound({
                inventory: 12,
                backlog: 0,
                shipmentArrived: 4,
                incomingOrder: 8,
            });

            expect(result).toEqual({
                shipped: 8,
                inventory: 8,
                backlog: 0,
                roundCost: 4,
            });
        });

        it('calculates retailer round 8 from fixture', () => {
            const result = calculatePlayerRound({
                inventory: 0,
                backlog: 0,
                shipmentArrived: 4,
                incomingOrder: 8,
            });

            expect(result).toEqual({
                shipped: 4,
                inventory: 0,
                backlog: 4,
                roundCost: 4,
            });
        });

        it('calculates retailer round 20 from fixture', () => {
            const result = calculatePlayerRound({
                inventory: 0,
                backlog: 48,
                shipmentArrived: 4,
                incomingOrder: 8,
            });

            expect(result).toEqual({
                shipped: 4,
                inventory: 0,
                backlog: 52,
                roundCost: 52,
            });
        });

    });

});
