import { SocketStream } from "@fastify/websocket";
import client from "../../database/redis";


export default async function (
    connection: SocketStream,
    key: string,
) {
    connection.socket.send('Game_state: ' + await client.GET(`${key}`));
}