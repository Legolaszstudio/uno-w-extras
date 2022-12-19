import { createClient } from 'redis';
import { logger } from '../logger';

export const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

export async function init()  {
    await client.connect();
    logger.info('Redis connected');
}

export default client;