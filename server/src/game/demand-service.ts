export class DemandService {
    getDemand(round: number): number {
        return round <= 4 ? 4 : 8;
    }
}
