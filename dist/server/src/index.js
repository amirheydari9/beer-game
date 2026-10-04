"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const game_service_1 = require("./game/game-service");
const game_routes_1 = require("./http/game-routes");
const game_ws_1 = require("./game/game-ws");
const app = (0, fastify_1.default)({
    logger: true,
});
const PORT = Number(process.env['PORT'] ?? 3000);
const gameService = new game_service_1.GameService();
const start = async () => {
    try {
        await app.register(cors_1.default, {
            origin: true,
        });
        await (0, game_routes_1.registerGameRoutes)(app, gameService);
        (0, game_ws_1.registerGameWebSocket)(app, gameService);
        await app.listen({
            port: PORT,
            host: '0.0.0.0',
        });
    }
    catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};
const shutdown = async () => {
    gameService.close();
    await app.close();
};
process.on('SIGINT', () => {
    void shutdown();
});
process.on('SIGTERM', () => {
    void shutdown();
});
void start();
