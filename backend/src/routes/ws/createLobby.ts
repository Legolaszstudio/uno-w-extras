import { SocketStream } from "@fastify/websocket";
import doesGameExist from "../../database/doesGameExist";
import { logger } from "../../logger";
import createLobby from "../../database/createLobby";

async function createUniqueId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i <= 5; i++) {
        uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await doesGameExist(uniqueId);
    if (exists) {
        return createUniqueId();
    }
    return uniqueId;
}

export default async function (
    connection: SocketStream,
    username: string,
) {
    const uniqueId = await createUniqueId();
    await createLobby(uniqueId, username);
    logger.info(`Created lobby ${uniqueId}`);
    connection.socket.send(`lobbyCreated ${uniqueId}`);
}