import mongoose from 'mongoose';

const answeredQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: {
    type: String,
    required: [true, 'Resposta é obrigatória'],
    trim: true,
    maxlength: [1000, 'Resposta deve ter no máximo 1000 caracteres']
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: [true, 'ID do vídeo é obrigatório']
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  watchedTime: {
    type: Number,
    default: 0,
    min: [0, 'Tempo assistido não pode ser negativo']
  },
  answeredQuestions: [answeredQuestionSchema],
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice composto único para evitar duplicatas
progressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Índices para melhor performance
progressSchema.index({ userId: 1 });
progressSchema.index({ videoId: 1 });
progressSchema.index({ isCompleted: 1 });
progressSchema.index({ completedAt: -1 });

export default mongoose.model('Progress', progressSchema);