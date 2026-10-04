"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRepository = void 0;
const ROLES = [
    'retailer',
    'wholesaler',
    'distributor',
    'factory',
];
class GameRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    findAll() {
        const games = this.database.db
            .prepare(`
                SELECT id
                FROM games
                ORDER BY created_at ASC
            `)
            .all();
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
    save(id, state) {
        const transaction = this.database.db.transaction(() => {
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
                .run(id, state.round, new Date().toISOString());
            const playerStatement = this.database.db.prepare(`
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
                            inventory = excluded.inventory,
                            backlog = excluded.backlog,
                            shipments_in_transit =
                                excluded.shipments_in_transit,
                            last_order_placed =
                                excluded.last_order_placed,
                            total_cost = excluded.total_cost,
                            joined = excluded.joined
                    `);
            for (const role of ROLES) {
                const player = state.players[role];
                playerStatement.run(id, role, player.inventory, player.backlog, JSON.stringify(player.shipmentsInTransit), player.lastOrderPlaced, player.totalCost, player.joined ? 1 : 0);
            }
        });
        transaction();
    }
    findById(id) {
        const game = this.database.db
            .prepare(`
                SELECT
                    id,
                    round,
                    created_at
                FROM games
                WHERE id = ?
            `)
            .get(id);
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
            .all(id);
        const playerState = {};
        for (const player of players) {
            playerState[player.role] = {
                role: player.role,
                joined: player.joined === 1,
                inventory: player.inventory,
                backlog: player.backlog,
                shipmentsInTransit: JSON.parse(player.shipments_in_transit),
                lastOrderPlaced: player.last_order_placed,
                totalCost: player.total_cost,
            };
        }
        for (const role of ROLES) {
            if (!playerState[role]) {
                throw new Error(`Player state not found for role: ${role}`);
            }
        }
        return {
            round: game.round,
            players: playerState,
        };
    }
    delete(id) {
        const result = this.database.db
            .prepare(`
                DELETE FROM games
                WHERE id = ?
            `)
            .run(id);
        return result.changes > 0;
    }
}
exports.GameRepository = GameRepository;
