import Fastify from 'fastify';

const app = Fastify({
    logger: true,
});

const PORT = Number(process.env['PORT'] ?? 3000);

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
