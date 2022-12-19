import Fastify from 'fastify';
import { logger } from './logger';

export const fastify = Fastify({
    trustProxy: 1,
});
const PORT = 3000;

fastify.addHook('onRequest', (request, reply, done) => {
    // Use https when possible
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    request.realip = (request.headers['x-real-ip'] as string) ?? request.ip;
    done();
});

fastify.addHook('onSend', (request, reply, payload, done) => {
    logger.info(`${request.realip} ${request.headers['user-agent'] ?? 'Unknown'}: ${request.method} ${request.url} - ${reply.statusCode} ${reply.statusCode === 429 ? ' (RATELIMITED)' : ''}`);
    done();
});

fastify.setErrorHandler((error, request, reply) => {
    logger.error(error, {
        request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
        }
    });
    if (!reply.sent) reply.status(500).send(error);
});

import webs from '@fastify/websocket';
fastify.register(webs);

import router from './routes/router';
fastify.register(router);


import { init as dbInit } from './database/redis';
async function main() {
    await dbInit();
    fastify.listen({
        port: PORT,
        host: '0.0.0.0',
    }, function (err, address) {
        if (err) {
            logger.error(err);
            process.exit(1);
        }
        logger.info(`API listening on ${address}`);
    });
}

main();