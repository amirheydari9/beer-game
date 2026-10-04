import type {Role} from '@shared/types';

import {GameSession} from './game-session';
import type {GameState} from './game-state';

const ROLES: Role[] = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];

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

export class GameService {
    private readonly sessions = new Map<string, GameSession>();

    createGame(): GameSession {
        const id = crypto.randomUUID();

        const session = new GameSession(
            id,
            createInitialState(),
        );

        this.sessions.set(id, session);

        return session;
    }

    getGame(id: string): GameSession | undefined {
        return this.sessions.get(id);
    }

    deleteGame(id: string): boolean {
        return this.sessions.delete(id);
    }

    listGames(): GameSession[] {
        return [...this.sessions.values()];
    }

    getRoles(): Role[] {
        return [...ROLES];
    }
}
