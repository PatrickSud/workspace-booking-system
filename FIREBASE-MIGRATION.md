# 🚀 Migração para Firebase - Sistema de Reserva de Espaços

Este projeto foi migrado de uma arquitetura tradicional (Express + PostgreSQL) para uma arquitetura moderna usando Firebase.

## 📋 Arquitetura Atual

### **Frontend**

- **React** com Material-UI
- **Vite** para build e desenvolvimento
- **Firebase Hosting** para hospedagem
- **Axios** para comunicação com Firebase Functions

### **Backend**

- **Firebase Functions** (Node.js 18)
- **Firestore** como banco de dados NoSQL
- **Firebase Authentication** para autenticação
- **Firebase Admin SDK** para operações server-side

### **Banco de Dados**

- **Firestore** (NoSQL document-based)
- **Regras de segurança** configuradas
- **Índices** otimizados para consultas

## 🛠️ Configuração do Projeto

### 1. **Pré-requisitos**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login no Firebase
firebase login
```

### 2. **Configuração do Firebase**

```bash
# Inicializar projeto Firebase
firebase init

# Selecionar:
# - Firestore
# - Functions
# - Hosting
```

### 3. **Variáveis de Ambiente**

Crie um arquivo `.env` no frontend com:

```env
VITE_FIREBASE_FUNCTIONS_URL=https://southamerica-east1-workspace-booking-system.cloudfunctions.net
VITE_FIREBASE_API_KEY=AIzaSyDYNdLXJkZl2t0_0NKLDb-I-bx12DGuiNo
VITE_FIREBASE_AUTH_DOMAIN=workspace-booking-system.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workspace-booking-system
VITE_FIREBASE_STORAGE_BUCKET=workspace-booking-system.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1060735424967
VITE_FIREBASE_APP_ID=1:1060735424967:web:b5e59a61de03db86f0e1e2
```

## 🚀 Deploy

### **Deploy Automático**

```bash
# Dar permissão de execução
chmod +x deploy-firebase.sh

# Executar deploy
./deploy-firebase.sh
```

### **Deploy Manual**

```bash
# 1. Build do frontend
cd frontend
npm run build
cd ..

# 2. Deploy das functions
firebase deploy --only functions

# 3. Deploy do hosting
firebase deploy --only hosting

# 4. Deploy das regras do Firestore
firebase deploy --only firestore:rules
```

## 📊 Estrutura das Collections do Firestore

### **users**

```javascript
{
  name: string,
  email: string,
  role: 'admin' | 'user',
  is_active: boolean,
  firebase_uid: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **buildings**

```javascript
{
  name: string,
  address: string,
  city: string,
  state: string,
  zip_code: string,
  country: string,
  description: string,
  is_active: boolean,
  settings: object,
  contact_info: object,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **floors**

```javascript
{
  name: string,
  floor_number: number,
  building_id: string,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **spaces**

```javascript
{
  name: string,
  space_type: string,
  capacity: number,
  floor_id: string,
  building_id: string,
  is_active: boolean,
  is_bookable: boolean,
  amenities: array,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **reservations**

```javascript
{
  user_id: string,
  space_id: string,
  floor_id: string,
  building_id: string,
  start_time: timestamp,
  end_time: timestamp,
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'completed',
  purpose: string,
  attendees_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **checkins**

```javascript
{
  reservation_id: string,
  user_id: string,
  space_id: string,
  check_in_time: timestamp,
  check_out_time: timestamp,
  qr_code: string,
  created_at: timestamp
}
```

## 🔒 Regras de Segurança do Firestore

As regras estão configuradas em `firestore.rules`:

- **Usuários**: Podem ler/escrever apenas seus próprios dados
- **Admins**: Podem ler/escrever todos os dados
- **Prédios/Andares/Espaços**: Leitura para todos, escrita apenas para admins
- **Reservas**: Usuários podem criar e gerenciar suas próprias reservas
- **Check-ins**: Usuários podem fazer check-in apenas em suas reservas

## 🧪 Testando Localmente

### **Emuladores do Firebase**

```bash
# Iniciar emuladores
firebase emulators:start

# URLs dos emuladores:
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
# - Auth: http://localhost:9099
# - Hosting: http://localhost:5000
```

### **Desenvolvimento Frontend**

```bash
cd frontend
npm run dev
```

## 📈 Monitoramento

### **Firebase Console**

- [Console do Firebase](https://console.firebase.google.com)
- Monitorar functions, Firestore, Authentication
- Ver logs e métricas de performance

### **Logs das Functions**

```bash
# Ver logs em tempo real
firebase functions:log

# Ver logs de uma function específica
firebase functions:log --only getAllBuildings
```

## 🔧 Comandos Úteis

```bash
# Ver status do projeto
firebase projects:list

# Ver configuração atual
firebase use

# Alterar projeto ativo
firebase use SEU-PROJETO-ID

# Ver logs de deploy
firebase deploy --only functions --debug

# Limpar cache
firebase functions:shell
```

## 🆘 Troubleshooting

### **Erro de CORS**

- Verificar se as origins estão configuradas corretamente no Firebase Functions
- Usar `cors` middleware nas functions

### **Erro de Autenticação**

- Verificar se o token está sendo enviado corretamente
- Verificar se as regras do Firestore permitem a operação

### **Erro de Deploy**

- Verificar se todas as dependências estão instaladas
- Verificar se o projeto Firebase está configurado corretamente
- Verificar logs com `--debug`

## 📚 Recursos Adicionais

- [Documentação Firebase Functions](https://firebase.google.com/docs/functions)
- [Documentação Firestore](https://firebase.google.com/docs/firestore)
- [Documentação Firebase Auth](https://firebase.google.com/docs/auth)
- [Documentação Firebase Hosting](https://firebase.google.com/docs/hosting)
