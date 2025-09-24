# Guia de Instalação e Execução - Sistema de Reserva de Espaços

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **PostgreSQL** (versão 14 ou superior)
- **npm** ou **yarn**

## Configuração do Banco de Dados

1. **Instale o PostgreSQL** se ainda não tiver
2. **Crie um banco de dados**:
   ```sql
   CREATE DATABASE workspace_booking;
   ```
3. **Crie um usuário** (opcional):
   ```sql
   CREATE USER workspace_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE workspace_booking TO workspace_user;
   ```

## Configuração do Backend

1. **Navegue até o diretório do backend**:
   ```bash
   cd backend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=workspace_booking
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui

   # JWT Configuration
   JWT_SECRET=sua_chave_secreta_jwt_super_segura_aqui
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Email Configuration (opcional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASSWORD=sua_senha_app

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Execute o seed para popular o banco com dados de exemplo**:
   ```bash
   npm run seed
   ```

5. **Inicie o servidor backend**:
   ```bash
   npm run dev
   ```

   O backend estará rodando em `http://localhost:3001`

## Configuração do Frontend

1. **Em um novo terminal, navegue até o diretório do frontend**:
   ```bash
   cd frontend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor frontend**:
   ```bash
   npm run dev
   ```

   O frontend estará rodando em `http://localhost:3000`

## Acessando o Sistema

Após executar ambos os servidores, acesse `http://localhost:3000` no seu navegador.

### Credenciais de Teste

O sistema vem com dados de exemplo pré-carregados:

**Administrador:**
- Email: `admin@workspace.com`
- Senha: `admin123`

**Usuário Regular:**
- Email: `ana.silva@empresa.com`
- Senha: `user123`

## Estrutura do Projeto

```
workspace-booking-system/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores das rotas
│   │   ├── models/          # Modelos do Sequelize
│   │   ├── routes/          # Definição das rotas
│   │   ├── middleware/      # Middlewares
│   │   ├── services/        # Lógica de negócio
│   │   ├── utils/           # Utilitários
│   │   └── database/        # Configuração do DB
│   ├── uploads/             # Arquivos enviados
│   └── package.json
├── frontend/                # Interface React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── contexts/        # Contextos React
│   │   └── utils/           # Utilitários
│   └── package.json
└── README.md
```

## Funcionalidades Implementadas

### ✅ Concluído
- Sistema de autenticação completo
- Modelos de dados (Usuários, Prédios, Andares, Espaços, Reservas)
- APIs RESTful para todas as entidades
- Interface de login e registro
- Dashboard administrativo básico
- Sistema de WebSocket para tempo real
- Estrutura completa do frontend React

### 🚧 Em Desenvolvimento
- Interface completa de gerenciamento de prédios
- Sistema de reservas com calendário
- Check-in via QR Code
- Relatórios e analytics
- Mapas interativos dos andares
- Sistema de notificações por email

## Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em modo produção
- `npm run seed` - Popula o banco com dados de exemplo

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção

## Solução de Problemas

### Erro de Conexão com o Banco
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Certifique-se de que o banco `workspace_booking` existe

### Erro de Porta em Uso
1. Verifique se as portas 3000 e 3001 estão livres
2. Altere as portas nos arquivos de configuração se necessário

### Problemas com Dependências
1. Delete as pastas `node_modules` e execute `npm install` novamente
2. Certifique-se de estar usando Node.js 18+

## Próximos Passos

1. **Implementar funcionalidades restantes** das páginas marcadas como "em desenvolvimento"
2. **Adicionar testes** unitários e de integração
3. **Configurar CI/CD** para deploy automático
4. **Implementar sistema de notificações** por email
5. **Adicionar mapas interativos** para visualização dos espaços
6. **Otimizar performance** e adicionar cache
7. **Implementar PWA** para acesso móvel

## Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Node.js, React e PostgreSQL**
