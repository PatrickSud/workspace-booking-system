# 🚀 Guia de Deploy Manual - Firebase

## 📋 **Passos para Deploy Completo:**

### **1. Configurar Projeto Firebase**

```bash
# Substitua SEU-PROJETO-ID pelo ID real do seu projeto
npx firebase use SEU-PROJETO-ID

# Verificar configuração
npx firebase use
```

### **2. Deploy das Regras do Firestore**

```bash
npx firebase deploy --only firestore:rules
```

### **3. Deploy dos Índices do Firestore**

```bash
npx firebase deploy --only firestore:indexes
```

### **4. Deploy das Firebase Functions**

```bash
npx firebase deploy --only functions
```

### **5. Deploy do Hosting**

```bash
npx firebase deploy --only hosting
```

### **6. Deploy Completo (Alternativa)**

```bash
npx firebase deploy
```

## 🔧 **Comandos de Verificação:**

### **Verificar Status do Projeto**

```bash
npx firebase projects:list
npx firebase use
```

### **Verificar Logs das Functions**

```bash
npx firebase functions:log
```

### **Verificar Hosting**

```bash
npx firebase hosting:channel:list
```

## 📊 **URLs Após Deploy:**

- **Frontend:** `https://workspace-booking-system.web.app`
- **Functions:** `https://us-central1-workspace-booking-system.cloudfunctions.net`
- **Console:** `https://console.firebase.google.com/project/workspace-booking-system`

## 🧪 **Testar Deploy:**

### **1. Testar Health Check**

```bash
curl https://us-central1-SEU-PROJETO-ID.cloudfunctions.net/health
```

### **2. Testar Frontend**

Acesse: `https://SEU-PROJETO-ID.web.app`

### **3. Testar Functions**

```bash
curl https://us-central1-SEU-PROJETO-ID.cloudfunctions.net/getAllBuildings
```

## 🔒 **Configurar Variáveis de Ambiente:**

### **Frontend (.env)**

```env
VITE_FIREBASE_FUNCTIONS_URL=https://southamerica-east1-workspace-booking-system.cloudfunctions.net
```

### **Functions (se necessário)**

```bash
npx firebase functions:config:set app.jwt_secret="sua-chave-secreta"
```

## 📚 **Próximos Passos:**

1. **Popular o banco de dados:**

   ```bash
   # Executar seed após deploy
   npx firebase functions:shell
   # Dentro do shell: seedDatabase()
   ```

2. **Configurar domínio personalizado (opcional):**

   ```bash
   npx firebase hosting:channel:deploy production
   ```

3. **Monitorar performance:**
   - Acesse o Firebase Console
   - Verifique métricas de Functions e Hosting
   - Configure alertas se necessário

## 🆘 **Troubleshooting:**

### **Erro de Autenticação**

```bash
npx firebase logout
npx firebase login
```

### **Erro de Projeto**

```bash
npx firebase use --add
```

### **Erro de Permissões**

- Verifique se você tem permissões de Owner/Editor no projeto
- Confirme se o projeto está ativo no Firebase Console

### **Erro de Build**

```bash
cd frontend
npm install
npm run build
```

## ✅ **Checklist de Deploy:**

- [ ] Projeto Firebase criado e configurado
- [ ] Serviços ativados (Firestore, Functions, Hosting, Auth)
- [ ] Login realizado com sucesso
- [ ] Projeto selecionado (`firebase use`)
- [ ] Regras do Firestore deployadas
- [ ] Índices do Firestore deployados
- [ ] Functions deployadas
- [ ] Frontend buildado e deployado
- [ ] URLs testadas e funcionando
- [ ] Banco de dados populado (seed)
- [ ] Variáveis de ambiente configuradas
