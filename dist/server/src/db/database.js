"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class AppDatabase {
    db;
    constructor(filename = 'beer-game.db') {
        this.db = new better_sqlite3_1.default(filename);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.createTables();
    }
    createTables() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                round INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS players (
                game_id TEXT NOT NULL,
                role TEXT NOT NULL,
                inventory INTEGER NOT NULL,
                backlog INTEGER NOT NULL,
                shipments_in_transit TEXT NOT NULL,
                last_order_placed INTEGER NOT NULL,
                total_cost REAL NOT NULL,
                joined INTEGER NOT NULL DEFAULT 0,


                PRIMARY KEY (game_id, role),

                FOREIGN KEY (game_id)
                    REFERENCES games(id)
                    ON DELETE CASCADE
            );
        `);
    }
    close() {
        this.db.close();
    }
}
exports.AppDatabase = AppDatabase;
