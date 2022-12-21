import { SocketStream } from "@fastify/websocket";
import getUsers from "../../database/getUsers";
import { logger } from "../../logger";
import client from "../../database/redis";
import broadcast from "../endpoints/broadcast";

export default async function (
    connection: SocketStream,
    key: string,
    userId: number,
    card: string,
) {
    const players = await getUsers(key);
    const currentPlayer = players.find((player) => player.id == userId);
    let currentPlayerId = parseInt(await client.GET(`${key}:currentPlayer`) ?? '0');

    if (currentPlayerId != userId) {
        connection.socket.send(`It is not player ${userId}'s turn`);
        return;
    }

    if (!currentPlayer?.cards.includes(card.split('_')[0])) {
        connection.socket.send(`Player ${userId} does not have card ${card}`);
        return;
    }

    const cardIndex = currentPlayer.cards.indexOf(card.split('_')[0]);
    currentPlayer.cards.splice(cardIndex, 1);
    const playerListIndex = players.indexOf(currentPlayer);
    players[playerListIndex].cards = currentPlayer.cards;

    await client.SET(`${key}:lastPlayer`, currentPlayerId);

    let direction = parseInt(await client.GET(`${key}:direction`) ?? '1');
    if (card.length == 2 && card[1] == 'r') {
        //Pulled the reverse card on you
        direction *= -1;
        await client.SET(`${key}:direction`, direction);
    }

    currentPlayerId += direction;
    if (currentPlayerId <= 0) {
        currentPlayerId = players.length;
    }
    if (currentPlayerId > players.length) {
        currentPlayerId = currentPlayerId - players.length;
    }

    // Tilto kartya esetén kettőt lépünk
    if (card.length == 2 && card[1] == 't') {
        currentPlayerId += direction;
        if (currentPlayerId <= 0) {
            currentPlayerId = players.length;
        }
        if (currentPlayerId > players.length) {
            currentPlayerId = currentPlayerId - players.length;
        }
    }

    await client.SET(`${key}:currentPlayer`, currentPlayerId);
    await client.SET(`${key}:users`, JSON.stringify(players));
    const stack: string[] = JSON.parse(await client.GET(`${key}:stack`) ?? '[]');
    stack.push(card);
    if (stack.length > 10) {
        if (!stack.every(c => c.includes('+'))) {
            stack.splice(0, 1);
        }
    }
    await client.SET(`${key}:stack`, JSON.stringify(stack));

    broadcast(
        key,
        `User ${userId} put card ${card}`,
    );

    broadcast(
        key,
        'lastPlayer: ' + await client.GET(`${key}:lastPlayer`),
    );

    broadcast(
        key,
        'currentStack: ' + JSON.stringify(stack),
    );

    broadcast(
        key,
        'currentPlayer: ' + currentPlayerId,
    );

    broadcast(
        key,
        'players: ' + JSON.stringify(players),
    );
}