import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import Video from '../models/Video.js';

const router = express.Router();

// Aplicar middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/videos - Listar vídeos do departamento do usuário
router.get('/', async (req, res) => {
  try {
    const userDepartment = req.user.department;

    const videos = await Video.find({ 
      department: userDepartment 
    }).sort({ createdAt: -1 });

    res.json(videos);

  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/videos/:id - Buscar vídeo específico
router.get('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const { id } = req.params;
    const userDepartment = req.user.department;

    const video = await Video.findOne({
      _id: id,
      department: userDepartment
    });

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado ou você não tem acesso a ele'
      });
    }

    res.json(video);

  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/videos/tags/all - Buscar todas as tags disponíveis para o departamento
router.get('/tags/all', async (req, res) => {
  try {
    const userDepartment = req.user.department;

    const videos = await Video.find({ 
      department: userDepartment 
    }, 'tags');

    // Extrair tags únicas
    const allTags = new Set();
    videos.forEach(video => {
      video.tags.forEach(tag => allTags.add(tag));
    });

    res.json(Array.from(allTags));

  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

export default router;