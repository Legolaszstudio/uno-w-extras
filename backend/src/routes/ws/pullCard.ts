import { SocketStream } from "@fastify/websocket";
import getUsers from "../../database/getUsers";
import client from "../../database/redis";
import { allCards, specialCards } from "../../globals";
import broadcast from "../endpoints/broadcast";

export default async function pullCard(
    connection: SocketStream,
    key: string,
    userId: number,
    noOfCards?: number,
) {
    const players = await getUsers(key);
    const currentPlayer = players.find((player) => player.id == userId);
    let currentPlayerId = parseInt(await client.GET(`${key}:currentPlayer`) ?? '0');

    if (currentPlayerId != userId || currentPlayer == null) {
        connection.socket.send(`It is not player ${userId}'s turn`);
        return;
    }

    const cardsInCirculation = JSON.parse(await client.GET(`${key}:cardsInCirculation`) ?? '[]');
    const tempCards = [...allCards, ...specialCards, ...specialCards, ...specialCards, ...specialCards];
    for (const usedCard of cardsInCirculation) {
        const index = tempCards.indexOf(usedCard);
        tempCards.splice(index, 1);
    }

    for (let i = 0; i < (noOfCards ?? 1); i++) {
        let cardIndex = Math.floor(Math.random() * tempCards.length);
        let card = tempCards[cardIndex];

        // 0,000001%
        if (Math.round(Math.random() * 100000) == 1) {
            card = "istenszagg";
        }

        currentPlayer?.cards.push(card);
        cardsInCirculation.push(card);

        broadcast(
            key,
            `Player ${userId} pulled a ${card}`,
        );

        tempCards.splice(cardIndex, 1);
    }

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
        'lastPlayer: ' + await client.GET(`${key}:lastPlayer`),
    );

    const stack: string[] = JSON.parse(await client.GET(`${key}:stack`) ?? '[]');
    if (noOfCards != null || (noOfCards ?? 1) > 1) {
        const lastcard = stack[stack.length - 1];
        stack.push(lastcard.replaceAll('+', '-'));
        await client.SET(`${key}:stack`, JSON.stringify(stack));
    }
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