import { SocketStream } from "@fastify/websocket";
import addUser from "../../database/addUser";
import { socketBindings } from "../socketer";
import broadcast from "../endpoints/broadcast";


export default async function (
    connection: SocketStream,
    username: string,
    key: string,
) {
    const result = await addUser(key, username);
    broadcast(key, `userJoined ${username} ${result.avatarColor}`)
    if (socketBindings[key] == null) {
        socketBindings[key] = [];
    }
    socketBindings[key].push(connection);
    connection.socket.send(`lobbyJoined ${key}`);
}