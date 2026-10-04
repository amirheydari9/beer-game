import type {Role} from './role';

export interface PlayerState {
    role: Role;
    inventory: number;
    backlog: number;
    incoming: number;
    outgoing: number;
}

export interface GameState {
    round: number;
    demand: number;
    players: PlayerState[];
}
