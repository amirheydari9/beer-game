export const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
] as const;

export type Role = typeof ROLES[number];
