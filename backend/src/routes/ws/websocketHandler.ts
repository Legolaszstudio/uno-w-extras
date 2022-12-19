import { SocketStream } from '@fastify/websocket';
import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../logger';
import createLobby from './createLobby';
import getGameState from './getGameState';
import joinLobby from './joinLobby';
import getPlayers from './getPlayers';
import recoLobby from './recoLobby';
import startGame from './startGame';
import getCurrentPlayer from './getCurrentPlayer';
import getStack from './getStack';

export default async function (
    request: FastifyRequest,
    reply: FastifyReply
) {
    const connection: SocketStream = request as any as SocketStream;
    connection.socket.on('message', async (message) => {
        const msg = message.toString();
        const split = msg.split(' ');
        logger.info(`${request.realip} websocket: ${msg}`);
        switch (split[0]) {
            case 'getGameState':
                await getGameState(
                    connection,
                    split[1],
                );
                break;
            case 'createLobby':
                await createLobby(
                    connection,
                    split[1],
                );
                break;
            case 'joinLobby':
                await joinLobby(
                    connection,
                    split[1],
                    split[2],
                );
                break;
            case 'getPlayers':
                getPlayers(
                    connection,
                    split[1],
                );
                break;
            case 'recoLobby':
                await recoLobby(
                    connection,
                    split[1],
                )
                break;
            case 'startGame':
                await startGame(
                    connection,
                    split[1],
                );
                break;
            case 'getCurrentPlayer':
                await getCurrentPlayer(
                    connection,
                    split[1],
                );
                break;
            case 'getStack':
                await getStack(
                    connection,
                    split[1],
                );
                break;
            default:
                connection.socket.send('Unknown command');
                logger.error('Unknown command', msg);
        }
    });
}