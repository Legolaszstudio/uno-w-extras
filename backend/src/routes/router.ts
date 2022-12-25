import { FastifyInstance, FastifyPluginOptions } from "fastify";
import rndQuestion from "./endpoints/rndQuestion";
import websocketHandler from "./ws/websocketHandler";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (err?: Error | undefined) => void
) {
    fastify.get('/api/websocket',  { websocket: true }, websocketHandler);
    fastify.get('/api/rndQuestion', rndQuestion);
    done();
}