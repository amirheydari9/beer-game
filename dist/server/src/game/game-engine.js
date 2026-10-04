"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const game_rules_1 = require("./game-rules");
const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];
class GameEngine {
    state;
    constructor(initialState) {
        this.state = initialState;
    }
    getState() {
        return this.state;
    }
    getPlayer(role) {
        const player = this.state.players[role];
        if (!player) {
            throw new Error(`Player state not found for role: ${role}`);
        }
        return player;
    }
    getOrder(orders, role) {
        const order = orders[role];
        if (order === undefined) {
            throw new Error(`Order not found for role: ${role}`);
        }
        return order;
    }
    playRound(input) {
        const round = this.state.round + 1;
        const players = {};
        for (const role of ROLES) {
            const player = this.getPlayer(role);
            const incomingOrder = role === 'retailer'
                ? input.customerDemand
                : this.getPlayer(this.getDownstreamRole(role)).lastOrderPlaced;
            const shipmentArrived = player.shipmentsInTransit[0] ?? 0;
            const result = (0, game_rules_1.calculatePlayerRound)({
                inventory: player.inventory,
                backlog: player.backlog,
                shipmentArrived,
                incomingOrder,
            });
            const orderPlaced = this.getOrder(input.orders, role);
            const totalCost = player.totalCost + result.roundCost;
            players[role] = {
                role,
                ...result,
                incomingOrder,
                orderPlaced,
                totalCost,
            };
        }
        // this.state = this.createNextState(
        //     round,
        //     input,
        //     players,
        // );
        this.state = this.createNextState(round, players);
        return {
            round,
            players,
        };
    }
    getRoundResult(results, role) {
        const result = results[role];
        if (!result) {
            throw new Error(`Round result not found for role: ${role}`);
        }
        return result;
    }
    createNextState(round, results) {
        const players = {};
        for (const role of ROLES) {
            const previous = this.getPlayer(role);
            const result = this.getRoundResult(results, role);
            players[role] = {
                role,
                inventory: result.inventory,
                backlog: result.backlog,
                shipmentsInTransit: this.advanceShipmentQueue(previous.shipmentsInTransit, this.getShipmentFor(role, results)),
                lastOrderPlaced: result.orderPlaced,
                totalCost: result.totalCost,
                joined: previous.joined
            };
        }
        return {
            round,
            players,
        };
    }
    getShipmentFor(role, results) {
        if (role === 'retailer') {
            return this.getRoundResult(results, 'wholesaler').shipped;
        }
        if (role === 'wholesaler') {
            return this.getRoundResult(results, 'distributor').shipped;
        }
        if (role === 'distributor') {
            return this.getRoundResult(results, 'factory').shipped;
        }
        return this.getRoundResult(results, 'factory').orderPlaced;
    }
    advanceShipmentQueue(queue, newShipment) {
        const nextQueue = [...queue];
        nextQueue.shift();
        nextQueue.push(newShipment);
        return nextQueue;
    }
    getDownstreamRole(role) {
        switch (role) {
            case 'wholesaler':
                return 'retailer';
            case 'distributor':
                return 'wholesaler';
            case 'factory':
                return 'distributor';
            case 'retailer':
                throw new Error('Retailer does not have a downstream role.');
        }
    }
}
exports.GameEngine = GameEngine;
