import Database from 'better-sqlite3';

export class AppDatabase {
    readonly db: Database.Database;

    constructor(
        filename = 'beer-game.db',
    ) {
        this.db = new Database(filename);

        this.db.pragma('journal_mode = WAL');

        this.createTables();
    }

    private createTables(): void {
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

                PRIMARY KEY (game_id, role),

                FOREIGN KEY (game_id)
                    REFERENCES games(id)
                    ON DELETE CASCADE
            );
        `);
    }

    close(): void {
        this.db.close();
    }
}
