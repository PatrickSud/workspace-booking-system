# 🚀 Guia de Início Rápido

## ⚠️ Problema com o start.bat?

Se o `start.bat` apresentou erros, siga este guia manual:

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **PostgreSQL** instalado e rodando
3. **Banco de dados** criado

### Criar o banco PostgreSQL:
```sql
-- Abra o pgAdmin ou psql e execute:
CREATE DATABASE workspace_booking;
```

## 🛠️ Instalação Manual

### 1. Navegue até a pasta do projeto
```bash
cd "C:\Users\Patrick Godoy\CascadeProjects\workspace-booking-system"
```

### 2. Configure o Backend
```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Configure o banco (se necessário, edite o .env)
# O arquivo .env já está configurado com valores padrão

# Execute o seed para criar dados de exemplo
npm run seed

# Inicie o servidor backend
npm run dev
```

O backend estará rodando em: http://localhost:3001

### 3. Configure o Frontend (NOVO TERMINAL)
```bash
# Abra um NOVO terminal/prompt de comando
cd "C:\Users\Patrick Godoy\CascadeProjects\workspace-booking-system"

# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor frontend
npm run dev
```

O frontend estará rodando em: http://localhost:3000

## 🔐 Credenciais de Teste

Após executar o seed, use estas credenciais:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@workspace.com | admin123 |
| **Usuário** | ana.silva@empresa.com | user123 |

## 🐛 Solução de Problemas

### Erro: "ENOENT: no such file or directory"
- Certifique-se de estar na pasta correta do projeto
- Verifique se as pastas `backend` e `frontend` existem

### Erro: "Node.js não encontrado"
- Instale o Node.js 18+ de https://nodejs.org/
- Reinicie o terminal após a instalação

### Erro: "Conexão com banco de dados"
- Verifique se o PostgreSQL está rodando
- Confirme se o banco `workspace_booking` foi criado
- Verifique as configurações no arquivo `backend/.env`

### Erro: "Porta em uso"
- Feche outros processos que possam estar usando as portas 3000 ou 3001
- Ou altere as portas nos arquivos de configuração

## ✅ Verificação

Se tudo estiver funcionando:
1. Backend: http://localhost:3001/health deve retornar status OK
2. Frontend: http://localhost:3000 deve mostrar a tela de login
3. Login com as credenciais de teste deve funcionar

## 📞 Ainda com problemas?

Execute o script de setup alternativo:
```bash
setup.bat
```

Ou siga as instruções detalhadas no arquivo `SETUP.md`.

---

**Após o sistema estar rodando, você terá acesso a um ambiente completo com dados de demonstração!** 🎉
