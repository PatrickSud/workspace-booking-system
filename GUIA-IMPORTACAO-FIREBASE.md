uj# 🚀 Guia de Importação de Dados para Firebase

## 📋 Método 1: Firebase Console (Mais Fácil)

### Passo 1: Acessar o Firebase Console

1. Abra o navegador e acesse: https://console.firebase.google.com/project/workspace-booking-system/firestore
2. Faça login com sua conta Google

### Passo 2: Criar Collections

1. Clique em "Começar coleção"
2. Crie a collection `users`:

   - Collection ID: `users`
   - Document ID: `admin-user`
   - Campos:
     - `name`: Administrador
     - `email`: admin@workspace.com
     - `role`: admin
     - `is_active`: true
     - `created_at`: 2024-01-01T00:00:00Z
     - `updated_at`: 2024-01-01T00:00:00Z

3. Adicione outro documento na collection `users`:
   - Document ID: `regular-user`
   - Campos:
     - `name`: Usuário Teste
     - `email`: user@workspace.com
     - `role`: user
     - `is_active`: true
     - `created_at`: 2024-01-01T00:00:00Z
     - `updated_at`: 2024-01-01T00:00:00Z

### Passo 3: Criar Collection Buildings

1. Crie a collection `buildings`:

   - Collection ID: `buildings`
   - Document ID: `building-1`
   - Campos (copie do arquivo firestore-data.json):
     ```json
     {
       "name": "Edifício Central",
       "address": "Rua das Flores, 123",
       "city": "São Paulo",
       "state": "SP",
       "zip_code": "01234-567",
       "country": "Brasil",
       "description": "Prédio principal da empresa",
       "is_active": true,
       "settings": {
         "business_hours": {
           "monday": { "start": "08:00", "end": "18:00", "enabled": true },
           "tuesday": { "start": "08:00", "end": "18:00", "enabled": true },
           "wednesday": { "start": "08:00", "end": "18:00", "enabled": true },
           "thursday": { "start": "08:00", "end": "18:00", "enabled": true },
           "friday": { "start": "08:00", "end": "18:00", "enabled": true },
           "saturday": { "start": "08:00", "end": "12:00", "enabled": false },
           "sunday": { "start": "08:00", "end": "12:00", "enabled": false }
         },
         "booking_rules": {
           "max_advance_days": 30,
           "min_duration_minutes": 30,
           "max_duration_minutes": 480,
           "max_concurrent_bookings": 3,
           "check_in_window_minutes": 15
         },
         "amenities": ["Wi-Fi", "Ar condicionado", "Projetor", "Café"]
       },
       "contact_info": {
         "phone": "(11) 1234-5678",
         "email": "central@workspace.com",
         "manager": "João Silva"
       },
       "created_at": "2024-01-01T00:00:00Z",
       "updated_at": "2024-01-01T00:00:00Z"
     }
     ```

2. Adicione outro documento:
   - Document ID: `building-2`
   - Campos (copie do arquivo firestore-data.json para o segundo prédio)

## 📋 Método 2: Firebase CLI (Se funcionando)

### Pré-requisitos

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Usar o projeto correto
firebase use workspace-booking-system
```

### Importar dados

```bash
# Importar usando o arquivo JSON
firebase firestore:import firestore-data.json --project workspace-booking-system
```

## 📋 Método 3: Script Node.js (Se Node.js estiver funcionando)

### Executar o script original

```bash
node quick-seed.js
```

## ✅ Verificação

Após importar os dados, verifique no Firebase Console:

1. Collection `users` deve ter 2 documentos
2. Collection `buildings` deve ter 2 documentos
3. Todos os campos devem estar preenchidos corretamente

## 🔧 Troubleshooting

### Se o Firebase CLI não funcionar:

- Use o Método 1 (Firebase Console)
- É mais visual e confiável

### Se o Node.js não funcionar:

- Use o Método 1 (Firebase Console)
- Ou instale Node.js primeiro

### Se houver erros de permissão:

- Verifique se está logado no Firebase Console
- Verifique se tem permissões no projeto

## 📞 Próximos Passos

Após importar os dados:

1. Teste o frontend para verificar se os dados aparecem
2. Configure as regras de segurança do Firestore
3. Faça deploy das Firebase Functions
4. Teste o sistema completo
