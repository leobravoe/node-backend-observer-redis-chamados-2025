// src/services/sseService.js
import { createClient } from 'redis';
import chalk from 'chalk';

let clients = [];

const sendEventsToAll = (data) => {
    clients.forEach(client => {
        client.res.write(`event: chamado-update\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

const addClient = (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);
    const clientId = Date.now();
    clients.push({ id: clientId, res });
    console.log(`[SSE] Cliente ${clientId} conectado. Total nesta instância: ${clients.length}`);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        console.log(`[SSE] Cliente ${clientId} desconectado. Total nesta instância: ${clients.length}`);
    });
};

const initialize = async () => {
    const redisURL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    const subscriber = createClient({
        url: redisURL,
        password: process.env.REDIS_PASSWORD || undefined,
    });
    
    subscriber.on('error', (err) => console.error(chalk.red('[Redis Subscriber] Erro de conexão:'), err));
    
    try {
        await subscriber.connect();
        console.log(chalk.green('[Redis Subscriber] Conectado e inscrito no canal "chamados-updates".'));
        
        await subscriber.subscribe('chamados-updates', (message) => {
            const data = JSON.parse(message);
            console.log(chalk.blue('[Redis Subscriber] Mensagem recebida, retransmitindo para clientes SSE...'));
            sendEventsToAll(data);
        });

    } catch (err) {
        console.error(chalk.red.bold('[Redis Subscriber] Não foi possível conectar/inscrever.'), err);
    }

    process.on('exit', () => {
        if (subscriber) subscriber.quit();
    });
};

export default {
    addClient,
    initialize,
};