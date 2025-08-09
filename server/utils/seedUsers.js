import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Script para criar usuários iniciais de demonstração
const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');

    // Verificar se já existem usuários
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Usuários já existem no banco de dados');
      return;
    }

    // Criar usuário admin
    const admin = new User({
      name: 'Administrador',
      email: 'admin@empresa.com',
      passwordHash: '123456',
      department: 'TI',
      role: 'admin'
    });

    // Criar usuário comum
    const user = new User({
      name: 'João Silva',
      email: 'user@empresa.com',
      passwordHash: '123456',
      department: 'Vendas',
      role: 'user'
    });

    await Promise.all([admin.save(), user.save()]);

    console.log('✅ Usuários de demonstração criados:');
    console.log('Admin: admin@empresa.com / 123456');
    console.log('User: user@empresa.com / 123456');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers();
}

export default seedUsers;