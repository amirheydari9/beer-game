import Fastify from 'fastify';
import cors from '@fastify/cors';
import {GameService} from './game/game-service';
import {registerGameRoutes} from './http/game-routes';
import {registerGameWebSocket} from './game/game-ws';

const app = Fastify({
    logger: true,
});

const PORT = Number(process.env['PORT'] ?? 3000);

const gameService = new GameService();

const start = async (): Promise<void> => {
    try {

        await app.register(cors, {
            origin: true,
        });

        await registerGameRoutes(
            app,
            gameService,
        );

        registerGameWebSocket(
            app,
            gameService,
        );

        await app.listen({
            port: PORT,
            host: '0.0.0.0',
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

const shutdown = async (): Promise<void> => {
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
