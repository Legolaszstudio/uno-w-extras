import { SocketStream } from "@fastify/websocket";
import getUsers from "../../database/getUsers";
import client from "../../database/redis";
import { allCards, specialCards } from "../../globals";
import broadcast from "../endpoints/broadcast";

export default async function (
    connection: SocketStream,
    key: string,
    userId: number,
) {
    const players = await getUsers(key);
    const currentPlayer = players.find((player) => player.id == userId);
    let currentPlayerId = parseInt(await client.GET(`${key}:currentPlayer`) ?? '0');

    if (currentPlayerId != userId || currentPlayer == null) {
        connection.socket.send(`It is not player ${userId}'s turn`);
        return;
    }

    // TODO: "istenszagg",

    const cardsInCirculation = JSON.parse(await client.GET(`${key}:cardsInCirculation`) ?? '[]');
    const tempCards = [...allCards, ...specialCards, ...specialCards, ...specialCards, ...specialCards];
    for (const usedCard of cardsInCirculation) {
        const index = tempCards.indexOf(usedCard);
        tempCards.splice(index, 1);
    }

    const card = tempCards[Math.floor(Math.random() * tempCards.length)];

    currentPlayer?.cards.push(card);
    cardsInCirculation.push(card);

    const playerListIndex = players.indexOf(currentPlayer);
    players[playerListIndex].cards = currentPlayer.cards;

    const direction = parseInt(await client.GET(`${key}:direction`) ?? '1');

    currentPlayerId += direction;
    if (currentPlayerId <= 0) {
        currentPlayerId = players.length;
    }
    if (currentPlayerId > players.length) {
        currentPlayerId = 1;
    }

    await client.SET(`${key}:cardsInCirculation`, JSON.stringify(cardsInCirculation));
    await client.SET(`${key}:users`, JSON.stringify(players));
    await client.SET(`${key}:currentPlayer`, currentPlayerId);

    broadcast(
        key,
        `Player ${userId} pulled a ${card}`,
    );

    broadcast(
        key,
        'players: ' + JSON.stringify(players),
    );

    broadcast(
        key,
        'currentPlayer: ' + currentPlayerId,
    );

    const stack: string[] = JSON.parse(await client.GET(`${key}:stack`) ?? '[]');
    broadcast(
        key,
        'currentStack: ' + JSON.stringify(stack),
    );
}