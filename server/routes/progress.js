import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import Progress from '../models/Progress.js';
import Video from '../models/Video.js';

const router = express.Router();

// Aplicar middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/progress - Buscar progresso do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const progress = await Progress.find({ userId })
      .populate('videoId', 'title department')
      .sort({ lastWatchedAt: -1 });

    res.json(progress);

  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/progress/:videoId - Buscar progresso específico de um vídeo
router.get('/:videoId', [
  param('videoId').isMongoId().withMessage('ID do vídeo inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'ID do vídeo inválido'
      });
    }

    const { videoId } = req.params;
    const userId = req.user._id;

    // Verificar se o vídeo existe e se o usuário tem acesso
    const video = await Video.findOne({
      _id: videoId,
      department: req.user.department
    });

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado ou você não tem acesso a ele'
      });
    }

    const progress = await Progress.findOne({ userId, videoId });

    res.json(progress);

  } catch (error) {
    console.error('Erro ao buscar progresso do vídeo:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/progress - Salvar/atualizar progresso
router.post('/', [
  body('videoId')
    .isMongoId()
    .withMessage('ID do vídeo inválido'),
  body('watchedTime')
    .isInt({ min: 0 })
    .withMessage('Tempo assistido deve ser um número positivo'),
  body('answeredQuestions')
    .optional()
    .isArray()
    .withMessage('Perguntas respondidas devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { videoId, watchedTime, answeredQuestions = [] } = req.body;
    const userId = req.user._id;

    // Verificar se o vídeo existe e se o usuário tem acesso
    const video = await Video.findOne({
      _id: videoId,
      department: req.user.department
    });

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado ou você não tem acesso a ele'
      });
    }

    // Buscar ou criar progresso
    let progress = await Progress.findOne({ userId, videoId });

    if (progress) {
      // Atualizar progresso existente
      progress.watchedTime = Math.max(progress.watchedTime, watchedTime);
      progress.lastWatchedAt = new Date();
      
      // Atualizar respostas
      if (answeredQuestions.length > 0) {
        // Mesclar respostas existentes com novas
        const existingAnswers = new Map(
          progress.answeredQuestions.map(q => [q.questionId.toString(), q])
        );

        answeredQuestions.forEach(answer => {
          // Verificar se a resposta está correta (para perguntas de múltipla escolha)
          const question = video.questions.find(q => q._id.toString() === answer.questionId);
          let isCorrect = false;
          
          if (question && question.type === 'multiple' && question.correctAnswer) {
            isCorrect = answer.answer.toLowerCase().trim() === 
                       question.correctAnswer.toLowerCase().trim();
          }

          existingAnswers.set(answer.questionId, {
            questionId: answer.questionId,
            answer: answer.answer,
            isCorrect
          });
        });

        progress.answeredQuestions = Array.from(existingAnswers.values());
      }

      await progress.save();
    } else {
      // Criar novo progresso
      const answeredQuestionsWithCorrectness = answeredQuestions.map(answer => {
        const question = video.questions.find(q => q._id.toString() === answer.questionId);
        let isCorrect = false;
        
        if (question && question.type === 'multiple' && question.correctAnswer) {
          isCorrect = answer.answer.toLowerCase().trim() === 
                     question.correctAnswer.toLowerCase().trim();
        }

        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect
        };
      });

      progress = new Progress({
        userId,
        videoId,
        watchedTime,
        answeredQuestions: answeredQuestionsWithCorrectness,
        startedAt: new Date(),
        lastWatchedAt: new Date()
      });

      await progress.save();
    }

    res.json({
      message: 'Progresso salvo com sucesso',
      progress
    });

  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/progress/complete - Marcar vídeo como concluído
router.post('/complete', [
  body('videoId')
    .isMongoId()
    .withMessage('ID do vídeo inválido'),
  body('watchedTime')
    .isInt({ min: 0 })
    .withMessage('Tempo assistido deve ser um número positivo'),
  body('answeredQuestions')
    .optional()
    .isArray()
    .withMessage('Perguntas respondidas devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { videoId, watchedTime, answeredQuestions = [] } = req.body;
    const userId = req.user._id;

    // Verificar se o vídeo existe e se o usuário tem acesso
    const video = await Video.findOne({
      _id: videoId,
      department: req.user.department
    });

    if (!video) {
      return res.status(404).json({
        message: 'Vídeo não encontrado ou você não tem acesso a ele'
      });
    }

    // Verificar se todas as perguntas obrigatórias foram respondidas
    if (video.questions.length > 0 && answeredQuestions.length < video.questions.length) {
      return res.status(400).json({
        message: 'Todas as perguntas devem ser respondidas antes de concluir o treinamento'
      });
    }

    // Buscar ou criar progresso
    let progress = await Progress.findOne({ userId, videoId });

    const answeredQuestionsWithCorrectness = answeredQuestions.map(answer => {
      const question = video.questions.find(q => q._id.toString() === answer.questionId);
      let isCorrect = false;
      
      if (question && question.type === 'multiple' && question.correctAnswer) {
        isCorrect = answer.answer.toLowerCase().trim() === 
                   question.correctAnswer.toLowerCase().trim();
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect
      };
    });

    if (progress) {
      // Atualizar progresso existente
      progress.watchedTime = Math.max(progress.watchedTime, watchedTime);
      progress.answeredQuestions = answeredQuestionsWithCorrectness;
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.lastWatchedAt = new Date();

      await progress.save();
    } else {
      // Criar novo progresso
      progress = new Progress({
        userId,
        videoId,
        watchedTime,
        answeredQuestions: answeredQuestionsWithCorrectness,
        isCompleted: true,
        startedAt: new Date(),
        completedAt: new Date(),
        lastWatchedAt: new Date()
      });

      await progress.save();
    }

    res.json({
      message: 'Treinamento concluído com sucesso',
      progress
    });

  } catch (error) {
    console.error('Erro ao concluir treinamento:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

export default router;