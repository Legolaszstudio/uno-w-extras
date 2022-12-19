import { SocketStream } from "@fastify/websocket";
import client from "../../database/redis";
import broadcast from "../endpoints/broadcast";
import getUsers from "../../database/getUsers";
import { allCards } from "../../globals";

export default async function (
    connection: SocketStream,
    key: string,
) {
    broadcast(key, 'starting 3');
    await new Promise(resolve => setTimeout(resolve, 1025));
    broadcast(key, 'starting 2');
    await new Promise(resolve => setTimeout(resolve, 1025));
    broadcast(key, 'starting 1');
    await new Promise(resolve => setTimeout(resolve, 1025));
    broadcast(key, 'starting 0');
    await client.SET(key, 1);
    const users = await getUsers(key);
    let tempCards = [...allCards];
    for (const user of users) {
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * tempCards.length);
            const card = tempCards[randomIndex];

            delete tempCards[randomIndex];
            tempCards = tempCards.filter((card) => card != null);

            user.cards.push(card);
        }
    }
    await client.SET(`${key}:users`, JSON.stringify(users));
    await client.SET(`${key}:currentPlayer`, 1);
    broadcast(key, 'started');
}