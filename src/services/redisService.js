// src/services/redisService.js
import { createClient } from 'redis';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

let publisher;
let subscriber;
let isPublisherReady = false;

const redisConfig = {
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD || undefined,
};

const initializePublisher = async () => {
    publisher = createClient(redisConfig);
    publisher.on('error', (err) => console.error(chalk.red('[Redis Publisher] Erro:'), err));
    publisher.on('connect', () => console.log(chalk.cyan('[Redis Publisher] Conectado.')));
    publisher.on('reconnecting', () => console.log(chalk.yellow('[Redis Publisher] Reconectando...')));
    publisher.on('ready', () => {
        isPublisherReady = true;
        console.log(chalk.green('[Redis Publisher] Pronto para publicar eventos.'));
    });
    await publisher.connect();
};

const initializeSubscriber = async (onMessageCallback) => {
    subscriber = publisher.duplicate();
    subscriber.on('error', (err) => console.error(chalk.red('[Redis Subscriber] Erro:'), err));
    await subscriber.connect();

    console.log(chalk.green('[Redis Subscriber] Conectado e inscrito no canal "chamados-updates".'));
    await subscriber.subscribe('chamados-updates', onMessageCallback);
};

const initialize = async (onMessageCallback) => {
    try {
        await initializePublisher();
        await initializeSubscriber(onMessageCallback);
    } catch (err) {
        console.error(chalk.red.bold('[Redis Service] Falha fatal ao inicializar.'), err);
        process.exit(1);
    }
};

const publishEvent = (channel, data) => {
    if (isPublisherReady) {
        publisher.publish(channel, JSON.stringify(data));
    } else {
        console.error(chalk.red('[Redis Publisher] Não está pronto, evento não publicado.'));
    }
};

process.on('exit', () => {
    if (publisher) publisher.quit();
    if (subscriber) subscriber.quit();
});

export default {
    initialize,
    publishEvent,
};