import Fastify from 'fastify';
import {registerGameWebSocket} from './game/game-ws';
import {GameService} from './game/game-service';
import {registerGameRoutes} from './http/game-routes';

const app = Fastify({
    logger: true,
});

const PORT = Number(process.env['PORT'] ?? 3000);

const gameService = new GameService();

app.get('/health', async () => {
    return {
        status: 'ok',
    };
});

const start = async (): Promise<void> => {
    try {
        await registerGameRoutes(app, gameService);

        registerGameWebSocket(app, gameService);

        await app.listen({
            port: PORT,
            host: '0.0.0.0',
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

void start();
