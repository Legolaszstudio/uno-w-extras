import { SocketStream } from "@fastify/websocket";
import { socketBindings } from "../socketer";

export default async function (
    connection: SocketStream,
    key: string,
) {
    if (socketBindings[key] == null) {
        socketBindings[key] = [];
    }
    socketBindings[key].push(connection);
    connection.socket.send(`lobbyJoined ${key}`);
}