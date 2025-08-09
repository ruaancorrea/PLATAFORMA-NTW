import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'training-platform',
      audience: 'training-users'
    }
  );
};

// POST /api/auth/login - Login de usuário
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos'
      });
    }

    // Gerar token
    const token = generateToken(user._id);

    // Atualizar último login (opcional)
    await User.findByIdAndUpdate(user._id, { 
      lastLoginAt: new Date() 
    });

    // Resposta de sucesso
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/register - Registro de usuário (apenas para desenvolvimento)
router.post('/register', [
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
    .withMessage('Departamento deve ter entre 2 e 100 caracteres')
], async (req, res) => {
  // Só permite registro em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Registro não disponível em produção'
    });
  }

  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password, department } = req.body;

    // Verificar se o e-mail já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'E-mail já cadastrado'
      });
    }

    // Criar novo usuário
    const user = new User({
      name,
      email,
      passwordHash: password,
      department,
      role: email.includes('admin') ? 'admin' : 'user' // Demo: admin se contém "admin" no email
    });

    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    
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

export default router;