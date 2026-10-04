"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandService = void 0;
class DemandService {
    getDemand(round) {
        return round <= 4 ? 4 : 8;
    }
}
exports.DemandService = DemandService;
