import client from "./redis";

export default async function createLobby(key: string, user: string) {
    await client.SET(key, 0);
    await client.SET(`${key}:users`, JSON.stringify([{
        id: 1,
        username: user,
        avatarColor: "#ffbf00",
    }]));
}