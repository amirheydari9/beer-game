"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
const game_engine_1 = require("./game-engine");
class GameSession {
    id;
    engine;
    players = new Set();
    pendingOrders = new Map();
    constructor(id, initialState) {
        this.id = id;
        this.engine = new game_engine_1.GameEngine(initialState);
        for (const role of Object.keys(initialState.players)) {
            if (initialState.players[role]?.joined) {
                this.players.add(role);
            }
        }
    }
    getState() {
        return this.engine.getState();
    }
    playRound(input) {
        return this.engine.playRound(input);
    }
    join(role) {
        if (this.players.has(role)) {
            throw new Error(`Role already joined: ${role}`);
        }
        this.players.add(role);
        const player = this.engine.getState().players[role];
        if (!player) {
            throw new Error(`Player state not found for role: ${role}`);
        }
        player.joined = true;
    }
    hasPlayer(role) {
        return this.players.has(role);
    }
    getPlayers() {
        return [...this.players];
    }
    getPlayer(role) {
        return this.getState().players[role];
    }
    placeOrder(role, quantity) {
        if (!this.hasPlayer(role)) {
            throw new Error(`Player has not joined: ${role}`);
        }
        if (this.pendingOrders.has(role)) {
            throw new Error(`Order already placed for role: ${role}`);
        }
        this.pendingOrders.set(role, quantity);
    }
    hasOrder(role) {
        return this.pendingOrders.has(role);
    }
    hasAllOrders() {
        return (this.players.size === 4 &&
            this.pendingOrders.size === 4);
    }
    getPendingOrders() {
        return Object.fromEntries(this.pendingOrders);
    }
    playPendingRound(customerDemand) {
        if (this.engine.getState().round >= 20) {
            throw new Error('Game is finished');
        }
        if (!this.hasAllOrders()) {
            throw new Error('Not all players have placed their orders');
        }
        const orders = {
            retailer: this.pendingOrders.get('retailer'),
            wholesaler: this.pendingOrders.get('wholesaler'),
            distributor: this.pendingOrders.get('distributor'),
            factory: this.pendingOrders.get('factory'),
        };
        const result = this.engine.playRound({
            orders,
            customerDemand,
        });
        this.pendingOrders.clear();
        return result;
    }
}
exports.GameSession = GameSession;
