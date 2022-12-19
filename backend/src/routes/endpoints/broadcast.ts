import { socketBindings } from "../socketer";

export default async function (key: string, message: string) {
    const connections = socketBindings[key] ?? [];
    connections.forEach((connection) => {
        connection.socket.send(message);
    });
}