import { FastifyInstance, FastifyPluginOptions } from "fastify";
import websocketHandler from "./ws/websocketHandler";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (err?: Error | undefined) => void
) {
    fastify.get('/api/websocket',  { websocket: true }, websocketHandler);
    done();
}