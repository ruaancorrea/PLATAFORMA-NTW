import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Progress from '../models/Progress.js';

const router = express.Router();

// Aplicar middlewares de autenticação e admin para todas as rotas
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats - Estatísticas do dashboard
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalVideos, progressData] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Video.countDocuments(),
      Progress.find().populate('userId', 'name department')
    ]);

    const totalCompletions = progressData.filter(p => p.isCompleted).length;
    const completionRate = progressData.length > 0 
      ? Math.round((totalCompletions / progressData.length) * 100) 
      : 0;

    res.json({
      totalUsers,
      totalVideos,
      totalCompletions,
      completionRate
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/users - Listar todos os usuários
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json(users);

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/users - Criar novo usuário
router.post('/users', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento deve ter entre 2 e 100 caracteres'),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Papel deve ser admin ou user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password, department, role } = req.body;

    // Verificar se o e-mail já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'E-mail já cadastrado'
      });
    }

    const user = new User({
      name,
      email,
      passwordHash: password,
      department,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id - Atualizar usuário
router.put('/users/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento deve ter entre 2 e 100 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Papel deve ser admin ou user')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Se a senha foi fornecida, hash ela
    if (updateData.password) {
      updateData.passwordHash = updateData.password;
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      message: 'Usuário atualizado com sucesso',
      user
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'E-mail já cadastrado'
      });
    }

    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/users/:id - Deletar usuário
router.delete('/users/:id', [
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

    // Não permitir que admin delete a si mesmo
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'Você não pode deletar sua própria conta'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    // Deletar progresso relacionado
    await Progress.deleteMany({ userId: id });

    res.json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/videos - Listar todos os vídeos
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);

  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/videos - Criar novo vídeo
router.post('/videos', [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Título deve ter entre 2 e 200 caracteres'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descrição deve ter entre 10 e 1000 caracteres'),
  body('videoLink')
    .isURL()
    .withMessage('Link do vídeo deve ser uma URL válida'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento deve ter entre 2 e 100 caracteres'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  body('pdfLink')
    .optional()
    .isURL()
    .withMessage('Link do PDF deve ser uma URL válida'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Perguntas devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const video = new Video(req.body);
    await video.save();

    res.status(201).json({
      message: 'Vídeo criado com sucesso',
      video
    });

  } catch (error) {
    console.error('Erro ao criar vídeo:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/videos/:id - Atualizar vídeo
router.put('/videos/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Título deve ter entre 2 e 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Descrição deve ter entre 10 e 1000 caracteres'),
  body('videoLink')
    .optional()
    .isURL()
    .withMessage('Link do vídeo deve ser uma URL válida'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento deve ter entre 2 e 100 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    const video = await Video.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado'
      });
    }

    res.json({
      message: 'Vídeo atualizado com sucesso',
      video
    });

  } catch (error) {
    console.error('Erro ao atualizar vídeo:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/videos/:id - Deletar vídeo
router.delete('/videos/:id', [
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

    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado'
      });
    }

    // Deletar progresso relacionado
    await Progress.deleteMany({ videoId: id });

    res.json({
      message: 'Vídeo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar vídeo:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/reports - Relatórios de progresso
router.get('/reports', async (req, res) => {
  try {
    const reports = await Progress.find()
      .populate('userId', 'name email department')
      .populate('videoId', 'title department')
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/departments - Listar departamentos únicos
router.get('/departments', async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json(departments);

  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

export default router;