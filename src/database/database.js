// src/database/database.js

import pg from 'pg';
import chalk from 'chalk';

const { Pool } = pg;

// Apenas declaramos a variável do pool aqui, sem inicializá-la.
let pool;

// Função para garantir que o pool seja criado apenas uma vez (padrão Singleton)
const getPool = () => {
  if (!pool) {
    // A criação do pool (new Pool) foi movida para dentro desta função.
    // Ela será chamada na primeira vez que db.query() for executado,
    // garantindo que as variáveis de ambiente já existem.
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
    console.log(chalk.blue('[DB Pool] Pool de conexões principal inicializado com sucesso.'));
  }
  return pool;
};

// O objeto 'db' que exportamos agora usa a função getPool()
// para garantir que o pool exista antes de executar a query.
const db = {
  query: (text, params) => {
    const poolInstance = getPool();
    return poolInstance.query(text, params);
  },
};

export default db;