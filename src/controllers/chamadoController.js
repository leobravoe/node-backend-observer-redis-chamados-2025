// src/controllers/chamadoController.js
import db from '../database/database.js';
import sseService from '../services/sseService.js';
import redisService from '../services/redisService.js';

// ... (código completo das funções getChamados, getChamadoById, etc., como na resposta anterior)
// As funções de escrita (create, update, delete) chamam redisService.publishEvent
// após a operação no banco ser bem-sucedida.

const parsePagination = (page, pageSize) => {
    const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);
    const validPage = !isNaN(pageInt) && pageInt > 0 ? pageInt : 1;
    const validPageSize = !isNaN(pageSizeInt) && pageSizeInt > 0 ? pageSizeInt : 10;
    return { limit: validPageSize, offset: (validPage - 1) * validPageSize };
};

const getChamados = async (req, res) => {
    const { estado, page, pageSize } = req.query;
    const { limit, offset } = parsePagination(page, pageSize);
    const estadoFiltro = estado || null;
    try {
        const query = `
            SELECT *, COUNT(*) OVER() AS total_count
            FROM chamados
            WHERE (estado = $1 OR $1 IS NULL)
            ORDER BY id DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [estadoFiltro, limit, offset]);
        const items = result.rows;
        const total = items.length > 0 ? parseInt(items[0].total_count, 10) : 0;
        items.forEach(item => delete item.total_count);
        res.json({ items, total });
    } catch (err) {
        console.error('Erro ao buscar chamados:', err);
        res.status(500).json({ error: 'Erro interno ao buscar chamados.' });
    }
};

const getChamadoById = async (req, res) => {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
        return res.status(400).json({ error: 'O ID fornecido é inválido.' });
    }
    try {
        const result = await db.query('SELECT * FROM chamados WHERE id = $1', [idInt]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chamado não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Erro ao buscar chamado #${idInt}:`, err);
        res.status(500).json({ error: 'Erro interno ao buscar o chamado.' });
    }
};

const createChamado = async (req, res) => {
    const { usuario_id, texto, estado, url_imagem } = req.body;
    if (!usuario_id || !texto) {
        return res.status(400).json({ error: 'O ID do usuário e o texto são obrigatórios.' });
    }
    const estadoFinal = (estado && ['a', 'f'].includes(estado)) ? estado : 'a';
    try {
        const query = `
            INSERT INTO chamados(usuario_id, texto, url_imagem, estado) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`;
        const result = await db.query(query, [usuario_id, texto, url_imagem, estadoFinal]);
        const novoChamado = result.rows[0];
        redisService.publishEvent('chamados-updates', { operation: 'INSERT', record: novoChamado });
        res.status(201).json(novoChamado);
    } catch (err) {
        console.error('Erro ao criar chamado:', err);
        if (err.code === '23503') {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(500).json({ error: 'Erro interno ao criar o chamado.' });
    }
};

const updateChamado = async (req, res) => {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
        return res.status(400).json({ error: 'O ID fornecido é inválido.' });
    }
    const { texto, estado, url_imagem, usuario_id } = req.body;
    if (estado && !['a', 'f'].includes(estado)) {
        return res.status(400).json({ error: "O campo 'estado' deve ser 'a' ou 'f'." });
    }
    try {
        const query = `
            UPDATE chamados 
            SET 
                texto = COALESCE($1, texto),
                estado = COALESCE($2, estado),
                url_imagem = COALESCE($3, url_imagem),
                usuario_id = COALESCE($4, usuario_id),
                data_atualizacao = now()
            WHERE id = $5 
            RETURNING *`;
        const result = await db.query(query, [texto, estado, url_imagem, usuario_id, idInt]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chamado não encontrado para atualização.' });
        }
        const chamadoAtualizado = result.rows[0];
        redisService.publishEvent('chamados-updates', { operation: 'UPDATE', record: chamadoAtualizado });
        res.json(chamadoAtualizado);
    } catch (err) {
        console.error(`Erro ao atualizar chamado #${idInt}:`, err);
        if (err.code === '23503') {
            return res.status(404).json({ error: 'O novo ID de usuário fornecido não existe.' });
        }
        res.status(500).json({ error: 'Erro interno ao atualizar o chamado.' });
    }
};

const deleteChamado = async (req, res) => {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
        return res.status(400).json({ error: 'O ID fornecido é inválido.' });
    }
    try {
        const result = await db.query('DELETE FROM chamados WHERE id = $1 RETURNING *', [idInt]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chamado não encontrado.' });
        }
        const chamadoDeletado = result.rows[0];
        redisService.publishEvent('chamados-updates', { operation: 'DELETE', record: chamadoDeletado });
        res.status(204).send();
    } catch (err) {
        console.error(`Erro ao deletar chamado #${idInt}:`, err);
        res.status(500).json({ error: 'Erro interno ao deletar o chamado.' });
    }
};

const handleEvents = (req, res) => {
    sseService.addClient(req, res);
};

export default {
    getChamados,
    getChamadoById,
    createChamado,
    updateChamado,
    deleteChamado,
    handleEvents,
};