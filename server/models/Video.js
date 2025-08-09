import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Pergunta é obrigatória'],
    trim: true,
    maxlength: [500, 'Pergunta deve ter no máximo 500 caracteres']
  },
  type: {
    type: String,
    enum: ['multiple', 'text'],
    required: [true, 'Tipo da pergunta é obrigatório']
  },
  options: [{
    type: String,
    trim: true,
    maxlength: [200, 'Opção deve ter no máximo 200 caracteres']
  }],
  correctAnswer: {
    type: String,
    trim: true,
    maxlength: [200, 'Resposta correta deve ter no máximo 200 caracteres']
  }
});

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [200, 'Título deve ter no máximo 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [1000, 'Descrição deve ter no máximo 1000 caracteres']
  },
  videoLink: {
    type: String,
    required: [true, 'Link do vídeo é obrigatório'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Link do vídeo deve ser uma URL válida'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag deve ter no máximo 50 caracteres']
  }],
  department: {
    type: String,
    required: [true, 'Departamento é obrigatório'],
    trim: true,
    maxlength: [100, 'Departamento deve ter no máximo 100 caracteres']
  },
  pdfLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link do PDF deve ser uma URL válida'
    }
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhor performance
videoSchema.index({ department: 1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ createdAt: -1 });

export default mongoose.model('Video', videoSchema);