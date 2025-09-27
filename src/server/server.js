// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import chamadoRoutes from '../routes/chamadoRoutes.js';
import redisService from '../services/redisService.js';
import sseService from '../services/sseService.js';

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).send('OK from Express Backend');
});

app.use('/api/chamados', chamadoRoutes);

app.listen(PORT, () => {
    console.log(chalk.bold.green(`Servidor Express rodando na porta ${PORT}`));
    // Inicializa os serviços de Redis e SSE
    redisService.initialize();
    sseService.initialize();
});