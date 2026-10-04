import type {Role} from './role';

export interface PlayerRoundResult {
    role: Role;
    inventory: number;
    backlog: number;
    order: number;
    shipment: number;
    cost: number;
}

export interface RoundResult {
    round: number;
    demand: number;
    players: PlayerRoundResult[];
    totalCost: number;
}
