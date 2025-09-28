// src/routes/chamadoRoutes.js
import express from 'express';
import chamadoController from '../controllers/chamadoController.js';
const router = express.Router();

// GET /api/chamados/events -> Rota SSE (mais específica, vem antes de /:id)
router.get('/events', chamadoController.handleEvents);

// GET /api/chamados -> Busca todos os chamados com filtro e paginação
router.get('/', chamadoController.getChamados);

// GET /api/chamados/:id -> Busca um chamado específico pelo seu ID
router.get('/:id', chamadoController.getChamadoById);

// POST /api/chamados -> Cria um novo chamado
router.post('/', chamadoController.createChamado);

// PATCH /api/chamados/:id -> Atualiza parcialmente um chamado
router.patch('/:id', chamadoController.updateChamado);

// DELETE /api/chamados/:id -> Deleta um chamado
router.delete('/:id', chamadoController.deleteChamado);

export default router;