import type {Role} from '@shared/types';

import {calculatePlayerRound, type PlayerRoundResult,} from './game-rules';
import type {GameState, PlayerGameState} from './game-state';

const ROLES: Role[] = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];

export interface RoundInput {
    orders: Record<Role, number>;
    customerDemand: number;
}

export interface RoundPlayerResult extends PlayerRoundResult {
    role: Role;
    orderPlaced: number;
    totalCost: number;
}

export interface RoundResult {
    round: number;
    players: Record<Role, RoundPlayerResult>;
}

export class GameEngine {
    private state: GameState;

    constructor(initialState: GameState) {
        this.state = initialState;
    }

    getState(): GameState {
        return this.state;
    }

    private getPlayer(role: Role): PlayerGameState {
        const player = this.state.players[role];
        if (!player) {
            throw new Error(`Player state not found for role: ${role}`);
        }
        return player;
    }

    private getOrder(orders: Record<Role, number>, role: Role): number {
        const order = orders[role];

        if (order === undefined) {
            throw new Error(`Order not found for role: ${role}`);
        }
        return order;
    }

    playRound(input: RoundInput): RoundResult {
        const round = this.state.round + 1;

        const players = {} as Record<Role, RoundPlayerResult>;

        for (const role of ROLES) {
            const player = this.getPlayer(role);

            const incomingOrder =
                role === 'retailer'
                    ? input.customerDemand
                    : this.getOrder(input.orders, this.getDownstreamRole(role));

            const shipmentArrived = player.shipmentsInTransit[0] ?? 0;

            const result = calculatePlayerRound({
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
                orderPlaced,
                totalCost,
            };
        }

        // this.state = this.createNextState(
        //     round,
        //     input,
        //     players,
        // );
        this.state = this.createNextState(
            round,
            players,
        );
        return {
            round,
            players,
        };
    }

    private getRoundResult(results: Record<Role, RoundPlayerResult>, role: Role): RoundPlayerResult {
        const result = results[role];
        if (!result) {
            throw new Error(`Round result not found for role: ${role}`);
        }
        return result;
    }

    private createNextState(
        round: number,
        results: Record<Role, RoundPlayerResult>,
    ): GameState {
        const players = {} as Record<Role, PlayerGameState>;

        for (const role of ROLES) {
            const previous = this.getPlayer(role);
            const result = this.getRoundResult(results, role);

            players[role] = {
                role,
                inventory: result.inventory,
                backlog: result.backlog,
                shipmentsInTransit: this.advanceShipmentQueue(
                    previous.shipmentsInTransit,
                    result.orderPlaced,
                ),
                lastOrderPlaced: result.orderPlaced,
                totalCost: result.totalCost,
            };
        }

        return {
            round,
            players,
        };
    }

    private advanceShipmentQueue(
        queue: number[],
        newShipment: number,
    ): number[] {
        const nextQueue = [...queue];

        nextQueue.shift();
        nextQueue.push(newShipment);

        return nextQueue;
    }

    private getDownstreamRole(role: Role): Role {
        switch (role) {
            case 'wholesaler':
                return 'retailer';

            case 'distributor':
                return 'wholesaler';

            case 'factory':
                return 'distributor';

            case 'retailer':
                throw new Error(
                    'Retailer does not have a downstream role.',
                );
        }
    }
}
