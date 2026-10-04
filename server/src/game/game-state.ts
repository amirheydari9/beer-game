import {Role} from "@shared/types";

export interface PlayerGameState {
    role: Role;
    inventory: number;
    backlog: number;
    shipmentsInTransit: number[];
    lastOrderPlaced: number;
    totalCost: number;
}

export interface GameState {
    round: number;
    players: Record<Role, PlayerGameState>;
}
