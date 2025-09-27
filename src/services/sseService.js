// src/services/sseService.js
import chalk from 'chalk';

const clients = [];

const addClient = (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);
    const clientId = Date.now();
    clients.push({ id: clientId, res });
    console.log(chalk.magenta(`[SSE] Cliente ${clientId} conectado. Total nesta instância: ${clients.length}`));

    req.on('close', () => {
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(chalk.magenta(`[SSE] Cliente ${clientId} desconectado. Total nesta instância: ${clients.length}`));
    });
};

const sendEventsToAll = (message) => {
    try {
        const data = JSON.parse(message);
        console.log(chalk.magenta('[SSE] Retransmitindo evento para', clients.length, 'clientes.'));
        clients.forEach(client => {
            client.res.write(`event: chamado-update\n`);
            client.res.write(`data: ${message}\n\n`);
        });
    } catch (err) {
        console.error(chalk.red('[SSE] Erro ao analisar ou enviar mensagem SSE:'), err);
    }
};

export default {
    addClient,
    sendEventsToAll,
};