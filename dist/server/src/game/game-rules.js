"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIPPING_DELAY = exports.BACKLOG_COST = exports.INVENTORY_COST = void 0;
exports.calculateRoundCost = calculateRoundCost;
exports.calculatePlayerRound = calculatePlayerRound;
exports.createShipmentQueue = createShipmentQueue;
exports.advanceShipmentQueue = advanceShipmentQueue;
exports.INVENTORY_COST = 0.5;
exports.BACKLOG_COST = 1.0;
exports.SHIPPING_DELAY = 2;
function calculateRoundCost(inventory, backlog) {
    return inventory * exports.INVENTORY_COST + backlog * exports.BACKLOG_COST;
}
function calculatePlayerRound(input) {
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
function createShipmentQueue(shipments) {
    return [...shipments];
}
function advanceShipmentQueue(queue, newShipment) {
    const nextQueue = [...queue];
    const arrived = nextQueue.shift() ?? 0;
    nextQueue.push(newShipment);
    return {
        arrived,
        queue: nextQueue,
    };
}
