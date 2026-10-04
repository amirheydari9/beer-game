export const INVENTORY_COST = 0.5;
export const BACKLOG_COST = 1.0;
export const SHIPPING_DELAY = 2;

export interface PlayerRoundInput {
    inventory: number;
    backlog: number;
    shipmentArrived: number;
    incomingOrder: number;
}

export interface PlayerRoundResult {
    shipped: number;
    inventory: number;
    backlog: number;
    roundCost: number;
}

export function calculateRoundCost(inventory: number, backlog: number): number {
    return inventory * INVENTORY_COST + backlog * BACKLOG_COST;
}

export function calculatePlayerRound(input: PlayerRoundInput): PlayerRoundResult {

    const availableInventory = input.inventory + input.shipmentArrived;

    const demand = input.incomingOrder + input.backlog;

    const shipped = Math.min(availableInventory, demand);

    const inventory = availableInventory - shipped;

    const backlog = demand - shipped;

    const roundCost = calculateRoundCost(inventory, backlog);

    return {
        shipped,
        inventory,
        backlog,
        roundCost,
    };
}
