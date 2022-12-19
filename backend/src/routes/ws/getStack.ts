import { SocketStream } from "@fastify/websocket";
import client from "../../database/redis";

export default async function (
    connection: SocketStream,
    key: string,
) {
    const result = await client.GET(`${key}:stack`);
    connection.socket.send('currentStack: ' + result);
}