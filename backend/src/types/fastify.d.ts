
import Fastify from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        realip?: string;
    }
}