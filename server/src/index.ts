import Fastify from 'fastify';

const app = Fastify({
    logger: true,
});

const PORT = Number(process.env['PORT'] ?? 3000);

app.get('/health', async () => {
    return {
        status: 'ok',
    };
});

const start = async (): Promise<void> => {
    try {
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
