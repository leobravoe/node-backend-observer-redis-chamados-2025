// src/services/redisService.js
import { createClient } from 'redis';
import chalk from 'chalk';

let publisher;
let isReady = false;

const initialize = async () => {
    const redisURL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    publisher = createClient({
        url: redisURL,
        password: process.env.REDIS_PASSWORD || undefined,
    });

    publisher.on('error', (err) => console.error(chalk.red('[Redis Publisher] Erro de conexão:'), err));
    publisher.on('connect', () => console.log(chalk.green('[Redis Publisher] Conectado.')));
    publisher.on('reconnecting', () => console.log(chalk.yellow('[Redis Publisher] Reconectando...')));
    publisher.on('ready', () => {
        isReady = true;
        console.log(chalk.green('[Redis Publisher] Pronto para publicar eventos.'));
    });

    try {
        await publisher.connect();
    } catch (err) {
        console.error(chalk.red.bold('[Redis Publisher] Não foi possível conectar ao Redis.'), err);
    }
};

const publishEvent = (channel, data) => {
    if (isReady) {
        publisher.publish(channel, JSON.stringify(data));
    } else {
        console.error(chalk.red('[Redis Publisher] Não está pronto, evento não publicado.'));
    }
};

process.on('exit', () => {
    if (publisher) publisher.quit();
});

export default {
    initialize,
    publishEvent,
};