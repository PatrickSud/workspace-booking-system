# Sistema Integrado de Gestão e Reserva de Espaços de Trabalho

Um sistema completo para gestão e reserva de espaços de trabalho, similar ao Robin ou WiseOffices, desenvolvido com tecnologias modernas e arquitetura escalável.

## 🚀 Início Rápido

### Opção 1: Execução Automática (Windows)
```bash
# Execute o script de inicialização
start.bat
```

### Opção 2: Execução Manual
Consulte o arquivo [SETUP.md](SETUP.md) para instruções detalhadas.

## 📋 Funcionalidades Principais

### 🏢 Módulo Administrativo
- ✅ Gerenciamento de múltiplos prédios e andares
- ✅ Configuração de espaços (estações de trabalho, salas de reunião)
- ✅ Gerenciamento de usuários e permissões
- 🚧 Upload e posicionamento interativo em plantas baixas
- ✅ Configuração de regras de reserva

### 👤 Módulo do Usuário
- ✅ Sistema de login seguro
- 🚧 Visualização de espaços em mapas interativos
- 🚧 Reserva simplificada com calendário
- 🚧 Gerenciamento de reservas pessoais
- ✅ Status em tempo real dos espaços

### 🔥 Funcionalidades Avançadas
- 🚧 Check-in via QR Code
- ✅ Comunicação em tempo real (WebSockets)
- 🚧 Relatórios e analytics detalhados
- 🚧 Sistema de notificações por email

**Legenda:** ✅ Implementado | 🚧 Em desenvolvimento | ❌ Não implementado

## 🏗️ Arquitetura

### Backend
- **Node.js** com Express.js
- **PostgreSQL** como banco de dados principal
- **Sequelize** ORM para modelagem de dados
- **Socket.IO** para comunicação em tempo real
- **JWT** para autenticação segura
- **Multer** para upload de arquivos
- **Bcrypt** para hash de senhas

### Frontend
- **React 18** com Hooks
- **Material-UI (MUI)** para componentes
- **React Router** para navegação
- **React Query** para gerenciamento de estado
- **Socket.IO Client** para tempo real
- **Axios** para requisições HTTP
- **Vite** como bundler

## 🔧 Tecnologias Utilizadas

| Categoria | Tecnologias |
|-----------|-------------|
| **Backend** | Node.js, Express.js, PostgreSQL, Sequelize, Socket.IO |
| **Frontend** | React, Material-UI, React Router, React Query, Vite |
| **Autenticação** | JWT, Bcrypt |
| **Tempo Real** | WebSockets (Socket.IO) |
| **Validação** | Joi, React Hook Form |
| **Upload** | Multer |
| **Notificações** | React Hot Toast |

## 📊 Dados de Demonstração

O sistema vem com dados pré-carregados para demonstração:

### 🏢 Estrutura
- **2 prédios** (Edifício Principal e Anexo Comercial)
- **4 andares** distribuídos entre os prédios
- **50+ espaços** de diferentes tipos
- **15 usuários** de exemplo
- **Reservas** para os próximos 7 dias

### 👥 Credenciais de Teste
| Tipo | Email | Senha | Descrição |
|------|-------|-------|-----------|
| **Admin** | admin@workspace.com | admin123 | Acesso completo ao sistema |
| **Usuário** | ana.silva@empresa.com | user123 | Usuário padrão |

## 📱 Instalação e Execução

### Pré-requisitos
- **Node.js** 18 ou superior
- **PostgreSQL** 14 ou superior
- **npm** ou **yarn**

### 🔄 Execução Rápida
1. Clone o repositório
2. Execute `start.bat` (Windows) ou siga o [SETUP.md](SETUP.md)
3. Acesse `http://localhost:3000`

### 🐳 Docker (Em breve)
```bash
docker-compose up
```

## 📁 Estrutura do Projeto

```
workspace-booking-system/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores das rotas
│   │   ├── models/          # Modelos do Sequelize
│   │   ├── routes/          # Definição das rotas
│   │   ├── middleware/      # Middlewares de auth/validação
│   │   ├── services/        # Lógica de negócio e WebSocket
│   │   ├── utils/           # Utilitários e validações
│   │   └── database/        # Configuração e seeds do DB
│   ├── uploads/             # Arquivos enviados pelos usuários
│   ├── .env                 # Variáveis de ambiente
│   └── package.json
├── frontend/                # Interface React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── contexts/        # Contextos React (Auth, Socket)
│   │   ├── hooks/           # Hooks customizados
│   │   └── utils/           # Utilitários do frontend
│   ├── public/              # Arquivos estáticos
│   ├── vite.config.js       # Configuração do Vite
│   └── package.json
├── start.bat                # Script de inicialização (Windows)
├── SETUP.md                 # Guia detalhado de instalação
└── README.md                # Este arquivo
```

## 🔌 APIs Disponíveis

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de novo usuário
- `GET /api/auth/profile` - Perfil do usuário logado
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/change-password` - Alterar senha

### Prédios
- `GET /api/buildings` - Listar prédios
- `GET /api/buildings/:id` - Detalhes do prédio
- `POST /api/buildings` - Criar prédio (admin)
- `PUT /api/buildings/:id` - Atualizar prédio (admin)
- `DELETE /api/buildings/:id` - Excluir prédio (admin)

### Andares
- `GET /api/floors/building/:buildingId` - Andares por prédio
- `GET /api/floors/:id` - Detalhes do andar
- `POST /api/floors` - Criar andar (admin)
- `PUT /api/floors/:id` - Atualizar andar (admin)

### Espaços
- `GET /api/spaces/floor/:floorId` - Espaços por andar
- `GET /api/spaces/:id` - Detalhes do espaço
- `GET /api/spaces/:id/availability` - Disponibilidade do espaço
- `POST /api/spaces` - Criar espaço (admin)
- `PUT /api/spaces/:id` - Atualizar espaço (admin)

### Reservas
- `GET /api/reservations/my-reservations` - Minhas reservas
- `GET /api/reservations/:id` - Detalhes da reserva
- `POST /api/reservations` - Criar reserva
- `PUT /api/reservations/:id` - Atualizar reserva
- `PUT /api/reservations/:id/cancel` - Cancelar reserva
- `POST /api/reservations/:id/check-in` - Fazer check-in

### Relatórios (Admin)
- `GET /api/reports/dashboard` - Estatísticas do dashboard
- `GET /api/reports/occupancy` - Relatório de ocupação
- `GET /api/reports/usage` - Relatório de uso
- `GET /api/reports/no-show` - Relatório de no-show

## 🔄 Status do Desenvolvimento

### ✅ Funcionalidades Implementadas
- [x] **Arquitetura completa** do sistema
- [x] **Autenticação JWT** com refresh token
- [x] **Modelos de dados** completos (Users, Buildings, Floors, Spaces, Reservations)
- [x] **APIs RESTful** para todas as entidades
- [x] **WebSocket** para comunicação em tempo real
- [x] **Interface de login/registro** responsiva
- [x] **Dashboard administrativo** com estatísticas
- [x] **Sistema de permissões** (admin/user)
- [x] **Validação de dados** no backend e frontend
- [x] **Sistema de notificações** toast
- [x] **Estrutura de componentes** reutilizáveis
- [x] **Seed de dados** para demonstração

### 🚧 Em Desenvolvimento (Próximas Implementações)
- [ ] **Interface completa** de gerenciamento de espaços
- [ ] **Sistema de reservas** com calendário interativo
- [ ] **Check-in via QR Code** com câmera
- [ ] **Mapas interativos** dos andares com drag-and-drop
- [ ] **Relatórios visuais** com gráficos
- [ ] **Sistema de notificações** por email
- [ ] **Upload de plantas baixas** dos andares
- [ ] **Reservas recorrentes** avançadas
- [ ] **Sistema de aprovação** para salas especiais
- [ ] **Integração com calendários** externos (Google, Outlook)

## 🚀 Roadmap

### Versão 1.1 (Próxima)
- Interface completa de reservas
- Check-in via QR Code
- Relatórios básicos

### Versão 1.2
- Mapas interativos
- Sistema de aprovações
- Notificações por email

### Versão 2.0
- App mobile (React Native)
- Integração com calendários
- Analytics avançados
- API pública

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Patrick Godoy**
- Sistema desenvolvido como demonstração de arquitetura full-stack moderna
- Tecnologias: Node.js, React, PostgreSQL, Socket.IO

---

**Desenvolvido com ❤️ usando Node.js, React e PostgreSQL**
│   │   ├── routes/          # Definição das rotas
│   │   ├── middleware/      # Middlewares
│   │   ├── services/        # Lógica de negócio
│   │   └── utils/           # Utilitários
│   ├── uploads/             # Arquivos enviados
│   └── package.json
├── frontend/                # Interface do usuário
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── hooks/           # Hooks customizados
│   │   └── utils/           # Utilitários
│   └── package.json
└── README.md
```

## Licença

MIT License
