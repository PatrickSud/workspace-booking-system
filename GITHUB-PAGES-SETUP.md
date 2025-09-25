# 🚀 Deploy no GitHub Pages

Este guia explica como configurar e fazer deploy da aplicação frontend no GitHub Pages.

## 📋 Pré-requisitos

- Conta no GitHub
- Repositório público ou GitHub Pro/Team para repositórios privados
- Node.js instalado localmente (para testes)

## ⚙️ Configuração Automática

A aplicação já está configurada para deploy automático no GitHub Pages. Siga estes passos:

### 1. Configurar GitHub Pages

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **GitHub Actions**
4. Salve as configurações

### 2. Fazer Push das Mudanças

```bash
# Adicionar todos os arquivos
git add .

# Commit das mudanças
git commit -m "feat: configure GitHub Pages deployment"

# Push para o branch main/master
git push origin main
```

### 3. Verificar Deploy

1. Vá para a aba **Actions** do seu repositório
2. Aguarde o workflow "Deploy to GitHub Pages" completar
3. Acesse sua aplicação em: `https://seu-usuario.github.io/workspace-booking-system/`

## 🔧 Configuração Manual (Alternativa)

Se preferir fazer deploy manual:

```bash
# Instalar dependências
cd frontend
npm install

# Fazer build
npm run build

# Deploy manual
npm run deploy
```

## 📁 Arquivos de Configuração

### `.github/workflows/deploy.yml`

Workflow do GitHub Actions que:

- Instala Node.js e dependências
- Faz build da aplicação
- Deploy automático para GitHub Pages

### `frontend/vite.config.js`

Configuração do Vite com:

- Base URL para GitHub Pages
- Proxy para desenvolvimento local

### `frontend/package.json`

Scripts adicionados:

- `deploy`: Build + deploy com gh-pages

## 🌐 URLs da Aplicação

- **Desenvolvimento local**: `http://localhost:3004`
- **GitHub Pages**: `https://seu-usuario.github.io/workspace-booking-system/`

## ⚠️ Limitações do GitHub Pages

- **Apenas Frontend**: GitHub Pages hospeda apenas arquivos estáticos
- **Sem Backend**: APIs não funcionarão em produção
- **Sem Banco de Dados**: Dados não persistirão entre sessões

## 🔄 Atualizações Automáticas

O deploy acontece automaticamente sempre que:

- Push para branch `main` ou `master`
- Pull request mergeado

## 🐛 Solução de Problemas

### Build Falha

```bash
# Verificar logs na aba Actions
# Limpar cache do npm
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Aplicação Não Carrega

- Verificar se a base URL está correta no `vite.config.js`
- Confirmar se o arquivo `.nojekyll` existe
- Aguardar alguns minutos para propagação do DNS

### Erro 404

- Verificar se o nome do repositório está correto na base URL
- Confirmar se o GitHub Pages está habilitado

## 📞 Suporte

Para problemas específicos:

1. Verificar logs na aba **Actions**
2. Consultar documentação do [GitHub Pages](https://docs.github.com/en/pages)
3. Verificar configurações do repositório

---

**✅ Configuração Completa!** Sua aplicação está pronta para deploy no GitHub Pages.
