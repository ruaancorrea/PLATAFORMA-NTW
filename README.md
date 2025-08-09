# Plataforma de Treinamento Corporativo

Uma plataforma completa para gerenciamento de treinamentos corporativos com sistema de vídeos, perguntas interativas e acompanhamento de progresso.

## 🚀 Características

- **Autenticação JWT** com roles (admin/usuário)
- **Dashboard Administrativo** para gerenciar usuários e conteúdos
- **Player de Vídeo Integrado** com suporte a YouTube e Google Drive
- **Sistema de Perguntas** com múltipla escolha e dissertativas
- **Controle de Progresso** com tempo assistido e validação de conclusão
- **Relatórios Detalhados** de desempenho e conclusão
- **Interface Responsiva** com design moderno
- **Filtros por Tags** e departamento

## 🛠️ Tecnologias

### Frontend
- React 18 + TypeScript
- TailwindCSS para estilização
- React Router para navegação
- Axios para requisições HTTP
- React Hook Form para formulários
- React Hot Toast para notificações

### Backend
- Node.js + Express
- MongoDB Atlas como banco de dados
- JWT para autenticação
- bcryptjs para hash de senhas
- Rate limiting para segurança
- Validação com express-validator

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repo-url>
cd plataforma-treinamento
```

2. **Instale as dependências**
```bash
npm run install-all
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=5000
MONGO_URI=sua-string-de-conexao-mongodb-atlas
JWT_SECRET=sua-chave-secreta-jwt-muito-segura
NODE_ENV=development
```

4. **Inicie o projeto**
```bash
npm run dev
```

A aplicação estará disponível em:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔑 Usuários de Demonstração

Para facilitar os testes, você pode usar estes usuários:

**Administrador:**
- Email: admin@empresa.com
- Senha: 123456

**Usuário:**
- Email: user@empresa.com
- Senha: 123456

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Contextos React
│   │   ├── pages/         # Páginas da aplicação
│   │   └── services/      # Serviços (API, etc.)
├── server/                # Backend Node.js
│   ├── models/           # Modelos do MongoDB
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Middlewares
│   └── utils/            # Utilitários
└── package.json          # Scripts principais
```

## 🎯 Funcionalidades

### Para Administradores
- ✅ Gerenciar usuários (CRUD completo)
- ✅ Gerenciar vídeos de treinamento
- ✅ Criar perguntas associadas aos vídeos
- ✅ Acompanhar relatórios de progresso
- ✅ Filtrar dados por departamento
- ✅ Exportar relatórios em CSV

### Para Usuários
- ✅ Visualizar vídeos do seu departamento
- ✅ Player integrado com YouTube/Google Drive
- ✅ Responder perguntas dos treinamentos
- ✅ Acompanhar seu próprio progresso
- ✅ Download de materiais PDF
- ✅ Filtrar vídeos por tags

## 🔒 Segurança

- Hash de senhas com bcrypt
- Autenticação JWT com refresh token
- Rate limiting para prevenir ataques
- Validação de dados de entrada
- Sanitização de inputs
- Helmet para headers de segurança
- CORS configurado adequadamente

## 🚀 Deploy

### Preparação para Deploy
1. Configure as variáveis de ambiente para produção
2. Execute o build do frontend:
```bash
cd client && npm run build
```

### Compatibilidade
O projeto é compatível com:
- ✅ Vercel (recomendado para frontend)
- ✅ Railway (recomendado para backend)
- ✅ Render
- ✅ Heroku
- ✅ DigitalOcean App Platform

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (apenas dev)

### Admin
- `GET /api/admin/stats` - Estatísticas
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `PUT /api/admin/users/:id` - Atualizar usuário
- `DELETE /api/admin/users/:id` - Deletar usuário
- `GET /api/admin/videos` - Listar vídeos
- `POST /api/admin/videos` - Criar vídeo
- `PUT /api/admin/videos/:id` - Atualizar vídeo
- `DELETE /api/admin/videos/:id` - Deletar vídeo
- `GET /api/admin/reports` - Relatórios

### Vídeos
- `GET /api/videos` - Listar vídeos (por departamento)
- `GET /api/videos/:id` - Vídeo específico

### Progresso
- `GET /api/progress` - Progresso do usuário
- `GET /api/progress/:videoId` - Progresso específico
- `POST /api/progress` - Salvar progresso
- `POST /api/progress/complete` - Marcar como concluído

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.