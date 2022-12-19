import { SocketStream } from "@fastify/websocket";

export const socketBindings: {[id: string]: SocketStream[]} = {};