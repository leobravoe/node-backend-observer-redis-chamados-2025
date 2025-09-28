// src/services/redisService.js
import { createClient } from 'redis';
import chalk from 'chalk';

let publisher;
let subscriber;
let isPublisherReady = false;

const redisConfig = {
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
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
    subscriber = createClient(redisConfig);
    subscriber.on('error', (err) => console.error(chalk.red('[Redis Subscriber] Erro:'), err));
    subscriber.on('connect', () => console.log(chalk.cyan('[Redis Subscriber] Conectado.')));
    subscriber.on('reconnecting', () => console.log(chalk.yellow('[Redis Subscriber] Reconectando...')));
    await subscriber.connect();
    console.log(chalk.green('[Redis Subscriber] Conectado e inscrito no canal "chamados-updates".'));
    await subscriber.subscribe('chamados-updates', (message, channel) => {
        console.log(chalk.blue(`[Redis Subscriber] Mensagem recebida no canal ${channel}:`), message);
        onMessageCallback(channel, message);
    });
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

// CORREÇÃO: A função agora é async e retorna a promessa da publicação.
const publishEvent = async (channel, data) => {
    if (isPublisherReady) {
        try {
            const message = JSON.stringify(data);
            console.log(chalk.blue(`[Redis Publisher] Publicando no canal ${channel}:`), message);
            const result = await publisher.publish(channel, message);
            console.log(chalk.green(`[Redis Publisher] Evento publicado com sucesso. Subscribers: ${result}`));
            return result;
        } catch (err) {
            console.error(chalk.red('[Redis Publisher] Erro ao publicar evento:'), err);
            throw err;
        }
    } else {
        console.error(chalk.red('[Redis Publisher] Não está pronto, evento não publicado.'));
        // Retorna uma promessa resolvida para não quebrar o await no controller.
        return Promise.resolve();
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