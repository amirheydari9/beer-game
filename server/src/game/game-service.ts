import type {Role} from '@shared/types';
import {DemandService} from './demand-service';
import {GameSession} from './game-session';
import type {GameState} from './game-state';

const ROLES: Role[] = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];

type GameChangeListener = (
    gameId: string,
    event: GameChangeEvent,
) => void;

export type GameChangeEvent =
    | {
    type: 'player-joined';
}
    | {
    type: 'order-placed';
    orders: Partial<Record<Role, number>>;
}
    | {
    type: 'round-played';
};

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
    private readonly demandService = new DemandService();

    private readonly listeners =
        new Set<GameChangeListener>();

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

    onGameChanged(
        listener: GameChangeListener,
    ): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    notifyGameChanged(
        gameId: string,
        event: GameChangeEvent,
    ): void {
        for (const listener of this.listeners) {
            listener(gameId, event);
        }
    }

    getCurrentDemand(gameId: string): number {
        const game = this.getGame(gameId);

        if (!game) {
            throw new Error(
                `Game not found: ${gameId}`,
            );
        }

        return this.demandService.getDemand(
            game.getState().round + 1,
        );
    }

    joinPlayer(
        gameId: string,
        role: Role,
    ): GameSession {
        const game = this.getGame(gameId);

        if (!game) {
            throw new Error(
                `Game not found: ${gameId}`,
            );
        }

        game.join(role);

        this.notifyGameChanged(
            gameId,
            {
                type: 'player-joined',
            },
        );

        return game;
    }

    placeOrder(
        gameId: string,
        role: Role,
        quantity: number,
    ): {
        game: GameSession;
        round: ReturnType<GameSession['playPendingRound']> | undefined;
    } {
        const game = this.getGame(gameId);

        if (!game) {
            throw new Error(
                `Game not found: ${gameId}`,
            );
        }

        game.placeOrder(role, quantity);

        if (!game.hasAllOrders()) {
            this.notifyGameChanged(
                gameId,
                {
                    type: 'order-placed',
                    orders: game.getPendingOrders(),
                },
            );

            return {
                game,
                round: undefined,
            };
        }

        const round = game.playPendingRound(
            this.getCurrentDemand(gameId),
        );

        this.notifyGameChanged(
            gameId,
            {
                type: 'round-played',
            },
        );

        return {
            game,
            round,
        };
    }
}
