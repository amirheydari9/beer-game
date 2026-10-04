import type {Role} from '@shared/types';

import {
    GameEngine,
    type RoundInput,
    type RoundResult,
} from './game-engine';
import type {GameState} from './game-state';

export class GameSession {
    readonly id: string;

    private readonly engine: GameEngine;

    private readonly players = new Set<Role>();

    private readonly pendingOrders = new Map<Role, number>();

    constructor(id: string, initialState: GameState) {
        this.id = id;
        this.engine = new GameEngine(initialState);

        for (const role of Object.keys(initialState.players) as Role[]) {
            if (initialState.players[role]?.joined) {
                this.players.add(role);
            }
        }
    }

    getState(): GameState {
        return this.engine.getState();
    }

    playRound(input: RoundInput): RoundResult {
        return this.engine.playRound(input);
    }

    join(role: Role): void {
        if (this.players.has(role)) {
            throw new Error(
                `Role already joined: ${role}`,
            );
        }

        this.players.add(role);

        const player = this.engine.getState().players[role];

        if (!player) {
            throw new Error(
                `Player state not found for role: ${role}`,
            );
        }

        player.joined = true;
    }

    hasPlayer(role: Role): boolean {
        return this.players.has(role);
    }

    getPlayers(): Role[] {
        return [...this.players];
    }

    getPlayer(role: Role) {
        return this.getState().players[role];
    }

    placeOrder(
        role: Role,
        quantity: number,
    ): void {
        if (!this.hasPlayer(role)) {
            throw new Error(
                `Player has not joined: ${role}`,
            );
        }

        if (this.pendingOrders.has(role)) {
            throw new Error(
                `Order already placed for role: ${role}`,
            );
        }

        this.pendingOrders.set(role, quantity);
    }

    hasOrder(role: Role): boolean {
        return this.pendingOrders.has(role);
    }

    hasAllOrders(): boolean {
        return (
            this.players.size === 4 &&
            this.pendingOrders.size === 4
        );
    }

    getPendingOrders(): Partial<Record<Role, number>> {
        return Object.fromEntries(
            this.pendingOrders,
        ) as Partial<Record<Role, number>>;
    }

    playPendingRound(customerDemand: number): RoundResult {
        if (!this.hasAllOrders()) {
            throw new Error(
                'Not all players have placed their orders',
            );
        }

        const orders = {
            retailer: this.pendingOrders.get('retailer')!,
            wholesaler: this.pendingOrders.get('wholesaler')!,
            distributor: this.pendingOrders.get('distributor')!,
            factory: this.pendingOrders.get('factory')!,
        };

        const result = this.engine.playRound({
            orders,
            customerDemand,
        });

        this.pendingOrders.clear();

        return result;
    }
}
