#!/usr/bin/env node

// --- IMPORTAÇÕES DE MÓDULOS ---
import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';
import format from 'pg-format';

// --- CONFIGURAÇÃO E VALIDAÇÃO ---
dotenv.config();

const {
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE,
    DB_ADMIN_DATABASE = 'postgres',
    DB_ADMIN_PASSWORD,
    DB_SCHEMA_FILE_PATH,
} = process.env;

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'DB_SCHEMA_FILE_PATH'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(chalk.red(`❌ Erro: A variável de ambiente ${varName} não está definida.`));
        process.exit(1);
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFilePath = path.resolve(process.cwd(), DB_SCHEMA_FILE_PATH);

const baseConfig = {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
};

const adminConfig = {
    ...baseConfig,
    database: DB_ADMIN_DATABASE,
    password: DB_ADMIN_PASSWORD || DB_PASSWORD,
};

const appConfig = {
    ...baseConfig,
    database: DB_DATABASE,
    password: DB_PASSWORD,
};

// --- FUNÇÕES AUXILIARES ---

async function resetDatabase() {
    const adminClient = new Client(adminConfig);
    try {
        await adminClient.connect();
        console.log(chalk.yellow(`- Conectado como admin ao banco "${DB_ADMIN_DATABASE}".`));

        console.log(chalk.yellow(`- Derrubando conexões existentes com "${DB_DATABASE}"...`));
        
        // MELHORIA: Adicionado "AND pid <> pg_backend_pid()"
        // Isso garante que a query nunca tente desconectar a si mesma.
        await adminClient.query(
            `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
            [DB_DATABASE]
        );

        console.log(chalk.yellow(`- Recriando o banco de dados "${DB_DATABASE}"...`));
        const dropQuery = format('DROP DATABASE IF EXISTS %I', DB_DATABASE);
        const createQuery = format('CREATE DATABASE %I', DB_DATABASE);

        await adminClient.query(dropQuery);
        await adminClient.query(createQuery);
        console.log(chalk.green(`- Banco de dados recriado com sucesso.`));

    } finally {
        await adminClient.end();
        console.log(chalk.gray('- Conexão de admin encerrada.'));
    }
}

async function applySchema() {
    let sql;
    try {
        console.log(chalk.cyan(`- Lendo SQL do arquivo: ${sqlFilePath}`));
        sql = await fs.readFile(sqlFilePath, 'utf8');
    } catch (error) {
        console.error(chalk.red(`❌ Erro fatal: Não foi possível ler o arquivo de schema em ${sqlFilePath}.`));
        throw error;
    }

    const appClient = new Client(appConfig);
    try {
        await appClient.connect();
        console.log(chalk.cyan(`- Conectado ao banco "${DB_DATABASE}" para aplicar o schema.`));
        await appClient.query(sql);
        console.log(chalk.green('- Schema SQL aplicado com sucesso.'));
    } finally {
        await appClient.end();
        console.log(chalk.gray('- Conexão da aplicação encerrada.'));
    }
}

// --- EXECUÇÃO PRINCIPAL ---
console.log(chalk.bold.blue('--- Iniciando processo de reset do banco de dados ---'));

try {
    await resetDatabase();
    await applySchema();
    console.log(chalk.bold.green('\n✅ Processo de reset finalizado com sucesso!'));
} catch (error) {
    console.error(chalk.bold.red('\n❌ ERRO FATAL: Não foi possível resetar o banco de dados.'));
    console.error(error);
    process.exit(1);
}