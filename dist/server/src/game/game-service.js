"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const demand_service_1 = require("./demand-service");
const game_session_1 = require("./game-session");
const database_1 = require("../db/database");
const game_repository_1 = require("../db/game-repository");
const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];
const createInitialState = () => ({
    round: 0,
    players: {
        retailer: {
            role: 'retailer',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
            joined: false
        },
        wholesaler: {
            role: 'wholesaler',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
            joined: false
        },
        distributor: {
            role: 'distributor',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
            joined: false
        },
        factory: {
            role: 'factory',
            inventory: 12,
            backlog: 0,
            shipmentsInTransit: [4, 4],
            lastOrderPlaced: 4,
            totalCost: 0,
            joined: false
        },
    },
});
class GameService {
    sessions = new Map();
    demandService = new demand_service_1.DemandService();
    database;
    repository;
    listeners = new Set();
    constructor(database = new database_1.AppDatabase()) {
        this.database = database;
        this.repository = new game_repository_1.GameRepository(database);
    }
    createGame() {
        const id = crypto.randomUUID();
        const state = createInitialState();
        const session = new game_session_1.GameSession(id, state);
        this.repository.save(id, state);
        this.sessions.set(id, session);
        return session;
    }
    getGame(id) {
        const existing = this.sessions.get(id);
        if (existing) {
            return existing;
        }
        const state = this.repository.findById(id);
        if (!state) {
            return undefined;
        }
        const session = new game_session_1.GameSession(id, state);
        this.sessions.set(id, session);
        return session;
    }
    deleteGame(id) {
        this.sessions.delete(id);
        return this.repository.delete(id);
    }
    listGames() {
        const games = this.repository.findAll();
        return games.map(({ id, state }) => {
            const existing = this.sessions.get(id);
            if (existing) {
                return existing;
            }
            const session = new game_session_1.GameSession(id, state);
            this.sessions.set(id, session);
            return session;
        });
    }
    getRoles() {
        return [...ROLES];
    }
    onGameChanged(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    notifyGameChanged(gameId, event) {
        for (const listener of this.listeners) {
            listener(gameId, event);
        }
    }
    getCurrentDemand(gameId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        return this.demandService.getDemand(game.getState().round + 1);
    }
    joinPlayer(gameId, role) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        game.join(role);
        this.repository.save(gameId, game.getState());
        this.notifyGameChanged(gameId, {
            type: 'player-joined',
        });
        return game;
    }
    placeOrder(gameId, role, quantity) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        game.placeOrder(role, quantity);
        if (!game.hasAllOrders()) {
            this.notifyGameChanged(gameId, {
                type: 'order-placed',
                orders: game.getPendingOrders(),
            });
            return {
                game,
                round: undefined,
            };
        }
        const round = game.playPendingRound(this.getCurrentDemand(gameId));
        this.repository.save(gameId, game.getState());
        this.notifyGameChanged(gameId, {
            type: 'round-played',
        });
        return {
            game,
            round,
        };
    }
    close() {
        this.database.close();
    }
}
exports.GameService = GameService;
