import { SocketStream } from '@fastify/websocket';
import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../logger';
import createLobby from './createLobby';

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
            case 'createLobby':
                await createLobby(
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