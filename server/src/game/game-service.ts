import type {Role} from '@shared/types';
import {DemandService} from './demand-service';
import {GameSession} from './game-session';
import {AppDatabase} from '../db/database';
import {GameRepository} from '../db/game-repository';
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
    private readonly database: AppDatabase;
    private readonly repository: GameRepository;
    private readonly listeners =
        new Set<GameChangeListener>();

    constructor(database = new AppDatabase()) {
        this.database = database;
        this.repository = new GameRepository(database);
    }

    createGame(): GameSession {
        const id = crypto.randomUUID();

        const state = createInitialState();

        const session = new GameSession(
            id,
            state,
        );

        this.repository.save(
            id,
            state,
        );

        this.sessions.set(
            id,
            session,
        );

        return session;
    }

    getGame(id: string): GameSession | undefined {
        const existing =
            this.sessions.get(id);

        if (existing) {
            return existing;
        }

        const state =
            this.repository.findById(id);

        if (!state) {
            return undefined;
        }

        const session = new GameSession(
            id,
            state,
        );

        this.sessions.set(
            id,
            session,
        );

        return session;
    }

    deleteGame(id: string): boolean {
        this.sessions.delete(id);
        return this.repository.delete(id);
    }

    listGames(): GameSession[] {
        const games = this.repository.findAll();

        return games.map(({id, state}) => {
            const existing =
                this.sessions.get(id);

            if (existing) {
                return existing;
            }

            const session = new GameSession(
                id,
                state,
            );

            this.sessions.set(
                id,
                session,
            );

            return session;
        });
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

        this.repository.save(
            gameId,
            game.getState(),
        );

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

        this.repository.save(
            gameId,
            game.getState(),
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

    close(): void {
        this.database.close();
    }
}
