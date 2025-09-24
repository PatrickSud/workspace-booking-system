# 🐘 Guia de Instalação do PostgreSQL

## 📥 Passo 1: Download e Instalação

### **Opção A: Instalador Oficial (Recomendado)**
1. **Acesse:** https://www.postgresql.org/download/windows/
2. **Clique em:** "Download the installer"
3. **Escolha:** PostgreSQL 15 ou 16 (versão mais recente)
4. **Baixe:** o arquivo .exe para Windows x86-64

### **Opção B: Via Chocolatey (se tiver instalado)**
```powershell
choco install postgresql
```

## 🛠️ Passo 2: Processo de Instalação

1. **Execute o instalador** como Administrador
2. **Configurações importantes:**
   - **Porta:** 5432 (padrão)
   - **Senha do superusuário (postgres):** `password` (ou anote a sua)
   - **Locale:** Portuguese, Brazil
   - **Componentes:** Marque todos (PostgreSQL Server, pgAdmin 4, Stack Builder)

3. **Finalize** a instalação

## 🔧 Passo 3: Configuração do Banco

### **Via pgAdmin (Interface Gráfica):**
1. **Abra o pgAdmin 4**
2. **Conecte** com a senha definida
3. **Clique direito em "Databases"** → Create → Database
4. **Nome:** `workspace_booking`
5. **Owner:** postgres
6. **Clique em "Save"**

### **Via Linha de Comando:**
```bash
# Abra o Command Prompt como Administrador
psql -U postgres

# Digite a senha quando solicitado
# No prompt do PostgreSQL, execute:
CREATE DATABASE workspace_booking;
\q
```

## ⚙️ Passo 4: Verificar Instalação

```bash
# Teste a conexão
psql -U postgres -d workspace_booking

# Se conectar com sucesso, digite:
\l  # Lista os bancos
\q  # Sair
```

## 🔐 Passo 5: Configurar Variáveis (Opcional)

Edite o arquivo `backend\.env` se quiser usar credenciais diferentes:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workspace_booking
DB_USER=postgres
DB_PASSWORD=password
```

## 🚀 Passo 6: Testar o Sistema

Após a instalação, execute:

```bash
# Na pasta do projeto
cd backend
npm run seed
npm run dev
```

## 🔍 Solução de Problemas

### **Erro: "psql não é reconhecido"**
- Adicione o PostgreSQL ao PATH do Windows:
- `C:\Program Files\PostgreSQL\15\bin`

### **Erro: "connection refused"**
- Verifique se o serviço PostgreSQL está rodando:
- Windows + R → `services.msc` → Procure "postgresql"

### **Erro: "authentication failed"**
- Verifique a senha do usuário postgres
- Tente resetar: `ALTER USER postgres PASSWORD 'password';`

### **Porta em uso**
- Verifique se a porta 5432 está livre
- Ou mude a porta no arquivo .env

## 📊 Verificação Final

Se tudo estiver correto, você deve conseguir:
1. ✅ Conectar no pgAdmin
2. ✅ Ver o banco `workspace_booking`
3. ✅ Executar `npm run seed` sem erros
4. ✅ Fazer login no sistema

---

**Após a instalação, execute o comando abaixo para testar:**
```bash
cd backend && npm run seed && npm run dev
```
