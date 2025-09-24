# 🌐 URLs do Sistema - Workspace Booking System

## 📍 URLs Fixas de Acesso

### 🎯 **URL Principal do Sistema**
```
http://localhost:3004
```

### 🔧 **URLs dos Serviços**
- **Frontend (Vite):** http://localhost:3004
- **Backend (Express):** http://localhost:3002
- **Health Check:** http://localhost:3002/health
- **API Base:** http://localhost:3002/api

### 📱 **Páginas Principais**
- **Login:** http://localhost:3004/login
- **Dashboard:** http://localhost:3004/dashboard
- **Espaços:** http://localhost:3004/spaces
- **Nova Reserva:** http://localhost:3004/reservations/new
- **Testes (Admin):** http://localhost:3004/admin/tests

## 🔑 **Credenciais de Acesso**

### 👨‍💼 **Administrador**
- **Email:** admin@workspace.com
- **Senha:** admin123

### 👤 **Usuário Comum**
- **Email:** ana.silva@empresa.com
- **Senha:** user123

## 🚀 **Como Iniciar o Sistema**

### Opção 1: Script Automático
```bash
# Execute o arquivo na raiz do projeto:
start-system.bat
```

### Opção 2: Manual
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🔧 **Configurações de Porta**

### Frontend (Vite)
- **Porta:** 3004
- **Host:** localhost (com network access)
- **Proxy:** Configurado para backend na porta 3002

### Backend (Express)
- **Porta:** 3002
- **CORS:** Configurado para aceitar localhost:3004

## 📊 **Status dos Serviços**

Para verificar se os serviços estão rodando:

```bash
# Verificar Backend
curl http://localhost:3002/health

# Verificar Frontend
curl http://localhost:3004
```

## 🎯 **URLs Sempre Fixas**

✅ **Frontend:** http://localhost:3004 (SEMPRE)
✅ **Backend:** http://localhost:3002 (SEMPRE)

Não há mais mudanças de porta aleatórias!
