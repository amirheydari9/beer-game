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

    constructor(
        id: string,
        initialState: GameState,
    ) {
        this.id = id;
        this.engine = new GameEngine(initialState);
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
}
