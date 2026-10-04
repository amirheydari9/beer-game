import {Role} from "./role";

export interface Shipment {
    from: Role;
    to: Role;
    quantity: number;
}
