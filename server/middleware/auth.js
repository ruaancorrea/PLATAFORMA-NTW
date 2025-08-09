import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acesso não fornecido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco de dados
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'Usuário não encontrado' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado' 
      });
    }
    
    console.error('Erro na autenticação:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Privilégios de administrador necessários.' 
    });
  }
  next();
};

// Middleware para verificar se o usuário é o próprio ou admin
export const requireOwnershipOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin' || req.user._id.toString() === targetUserId) {
    return next();
  }
  
  res.status(403).json({ 
    message: 'Acesso negado. Você só pode acessar seus próprios dados.' 
  });
};