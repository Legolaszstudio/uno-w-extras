import { SocketStream } from "@fastify/websocket";
import client from "../../database/redis";
import broadcast from "../endpoints/broadcast";
import getUsers from "../../database/getUsers";
import { allCards } from "../../globals";

function getStartingCard(): string {
    const startableCards = [
        'p0', 'p1', 'p2', 'p3', 'p4', 'p5',
        'p6', 'p7', 'p8', 'p9', 'z0', 'z1',
        'z2', 'z3', 'z4', 'z5', 'z6', 'z7',
        'z8', 'z9', 'k0', 'k1', 'k2', 'k3',
        'k4', 'k5', 'k6', 'k7', 'k8', 'k9',
        's0', 's1', 's2', 's3', 's4', 's5',
        's6', 's7', 's8', 's9'
    ];
    return startableCards[Math.floor(Math.random() * startableCards.length)];
}

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
    await client.SET(`${key}:stack`, JSON.stringify([getStartingCard()]));
    broadcast(key, 'started');
}