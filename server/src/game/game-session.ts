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

    constructor(id: string, initialState: GameState) {
        this.id = id;
        this.engine = new GameEngine(initialState);
    }

    getState(): GameState {
        return this.engine.getState();
    }

    playRound(input: RoundInput): RoundResult {
        return this.engine.playRound(input);
    }

    getPlayer(role: Role) {
        return this.getState().players[role];
    }
}
