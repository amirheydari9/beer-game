import type {Role} from '@shared/types';

import type {
    GameState,
    PlayerGameState,
} from '../game/game-state';

import {AppDatabase} from './database';

const ROLES: Role[] = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];

interface GameRow {
    id: string;
    round: number;
    created_at: string;
}

interface PlayerRow {
    game_id: string;
    role: Role;
    inventory: number;
    backlog: number;
    shipments_in_transit: string;
    last_order_placed: number;
    total_cost: number;
    joined: number;
}

export class GameRepository {
    constructor(
        private readonly database: AppDatabase,
    ) {}

    findAll(): Array<{
        id: string;
        state: GameState;
    }> {
        const games = this.database.db
            .prepare(`
                SELECT id
                FROM games
                ORDER BY created_at ASC
            `)
            .all() as Array<{
            id: string;
        }>;

        return games.flatMap((game) => {
            const state = this.findById(game.id);

            if (!state) {
                return [];
            }

            return [{
                id: game.id,
                state,
            }];
        });
    }

    save(
        id: string,
        state: GameState,
    ): void {
        const transaction =
            this.database.db.transaction(() => {
                this.database.db
                    .prepare(`
                        INSERT INTO games (
                            id,
                            round,
                            created_at
                        )
                        VALUES (?, ?, ?)
                        ON CONFLICT(id)
                        DO UPDATE SET
                            round = excluded.round
                    `)
                    .run(
                        id,
                        state.round,
                        new Date().toISOString(),
                    );

                const playerStatement =
                    this.database.db.prepare(`
                        INSERT INTO players (
                            game_id,
                            role,
                            inventory,
                            backlog,
                            shipments_in_transit,
                            last_order_placed,
                            total_cost,
                            joined
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(game_id, role)
                        DO UPDATE SET
                            inventory =
                                excluded.inventory,
                            backlog =
                                excluded.backlog,
                            shipments_in_transit =
                                excluded.shipments_in_transit,
                            last_order_placed =
                                excluded.last_order_placed,
                            total_cost =
                                excluded.total_cost,
                            joined =
                                excluded.joined
                    `);

                for (const role of ROLES) {
                    const player = state.players[role];

                    playerStatement.run(
                        id,
                        role,
                        player.inventory,
                        player.backlog,
                        JSON.stringify(
                            player.shipmentsInTransit,
                        ),
                        player.lastOrderPlaced,
                        player.totalCost,
                        0,
                    );
                }
            });

        transaction();
    }

    findById(
        id: string,
    ): GameState | undefined {
        const game = this.database.db
            .prepare(`
                SELECT
                    id,
                    round,
                    created_at
                FROM games
                WHERE id = ?
            `)
            .get(id) as GameRow | undefined;

        if (!game) {
            return undefined;
        }

        const players = this.database.db
            .prepare(`
                SELECT
                    game_id,
                    role,
                    inventory,
                    backlog,
                    shipments_in_transit,
                    last_order_placed,
                    total_cost,
                    joined
                FROM players
                WHERE game_id = ?
            `)
            .all(id) as PlayerRow[];

        const playerState =
            {} as Record<Role, PlayerGameState>;

        for (const player of players) {
            playerState[player.role] = {
                role: player.role,
                inventory: player.inventory,
                backlog: player.backlog,
                shipmentsInTransit:
                    JSON.parse(
                        player.shipments_in_transit,
                    ) as number[],
                lastOrderPlaced:
                player.last_order_placed,
                totalCost:
                player.total_cost,
            };
        }

        for (const role of ROLES) {
            if (!playerState[role]) {
                throw new Error(
                    `Player state not found for role: ${role}`,
                );
            }
        }

        return {
            round: game.round,
            players: playerState,
        };
    }

    delete(id: string): boolean {
        const result = this.database.db
            .prepare(`
                DELETE FROM games
                WHERE id = ?
            `)
            .run(id);

        return result.changes > 0;
    }
}
