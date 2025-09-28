// src/services/sseService.js
import chalk from 'chalk';

const clients = [];

const addClient = (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Desabilita buffering do nginx
    };
    res.writeHead(200, headers);
    
    const clientId = Date.now();
    clients.push({ id: clientId, res });
    console.log(chalk.magenta(`[SSE] Cliente ${clientId} conectado. Total nesta instância: ${clients.length}`));

    // Enviar evento de conexão inicial
    res.write(`event: connection\n`);
    res.write(`data: {"status": "connected", "clientId": ${clientId}}\n\n`);

    // Configurar heartbeat para manter a conexão viva
    const heartbeat = setInterval(() => {
        try {
            res.write(`event: heartbeat\n`);
            res.write(`data: {"timestamp": ${Date.now()}}\n\n`);
        } catch (err) {
            console.log(chalk.yellow(`[SSE] Heartbeat falhou para cliente ${clientId}, removendo...`));
            clearInterval(heartbeat);
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients.splice(index, 1);
            }
        }
    }, 30000); // Heartbeat a cada 30 segundos

    req.on('close', () => {
        clearInterval(heartbeat);
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(chalk.magenta(`[SSE] Cliente ${clientId} desconectado. Total nesta instância: ${clients.length}`));
    });

    req.on('error', (err) => {
        console.log(chalk.red(`[SSE] Erro na conexão do cliente ${clientId}:`), err);
        clearInterval(heartbeat);
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
};

const sendEventsToAll = (message) => {
    try {
        const data = JSON.parse(message);
        console.log(chalk.magenta('[SSE] Retransmitindo evento para', clients.length, 'clientes.'));
        
        // Filtrar clientes ativos e enviar evento
        const activeClients = [];
        clients.forEach((client, index) => {
            try {
                client.res.write(`event: chamado-update\n`);
                client.res.write(`data: ${message}\n\n`);
                activeClients.push(client);
            } catch (err) {
                console.log(chalk.yellow(`[SSE] Cliente ${client.id} desconectado durante envio, removendo...`));
                clients.splice(index, 1);
            }
        });
        
        // Atualizar lista de clientes ativos
        clients.length = 0;
        clients.push(...activeClients);
        
    } catch (err) {
        console.error(chalk.red('[SSE] Erro ao analisar ou enviar mensagem SSE:'), err);
    }
};

export default {
    addClient,
    sendEventsToAll,
};