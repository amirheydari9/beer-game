import fixture from '../../../fixtures/everyone-orders-four.json';

import {describe, expect, it} from 'vitest';

describe('fixture', () => {
    it('loads everyone-orders-four fixture', () => {
        expect(fixture).toBeDefined();
        expect(fixture.initial).toBeDefined();
        expect(fixture.rounds).toBeDefined();
        expect(fixture.rounds).toHaveLength(20);
    });
});
