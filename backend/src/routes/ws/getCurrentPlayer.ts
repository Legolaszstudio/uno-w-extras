import { SocketStream } from "@fastify/websocket";
import client from "../../database/redis";

export default async function (
    connection: SocketStream,
    key: string,
) {
    const currentPlayer = await client.GET(`${key}:currentPlayer`);
    connection.socket.send('currentPlayer: ' + currentPlayer);
}