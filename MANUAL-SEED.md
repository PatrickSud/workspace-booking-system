# 🌱 Dados para Popular o Firestore Manualmente

## 👤 Usuários para Criar no Firebase Auth

### Admin User

- **Email:** admin@workspace.com
- **Senha:** admin123
- **Nome:** Administrador
- **Role:** admin

### Regular User

- **Email:** user@workspace.com
- **Senha:** user123
- **Nome:** Usuário Teste
- **Role:** user

## 🏢 Prédios para Criar no Firestore

### Prédio 1: Edifício Central

```json
{
  "name": "Edifício Central",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "country": "Brasil",
  "description": "Prédio principal da empresa com modernas instalações",
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

### Prédio 2: Anexo Sul

```json
{
  "name": "Anexo Sul",
  "address": "Av. Paulista, 1000",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01310-100",
  "country": "Brasil",
  "description": "Anexo com foco em inovação e startups",
  "is_active": true,
  "settings": {
    "business_hours": {
      "monday": { "start": "09:00", "end": "19:00", "enabled": true },
      "tuesday": { "start": "09:00", "end": "19:00", "enabled": true },
      "wednesday": { "start": "09:00", "end": "19:00", "enabled": true },
      "thursday": { "start": "09:00", "end": "19:00", "enabled": true },
      "friday": { "start": "09:00", "end": "19:00", "enabled": true },
      "saturday": { "start": "09:00", "end": "13:00", "enabled": true },
      "sunday": { "start": "09:00", "end": "13:00", "enabled": false }
    },
    "booking_rules": {
      "max_advance_days": 60,
      "min_duration_minutes": 60,
      "max_duration_minutes": 600,
      "max_concurrent_bookings": 5,
      "check_in_window_minutes": 30
    },
    "amenities": ["Wi-Fi", "Cozinha", "Estacionamento", "Sala de jogos"]
  },
  "contact_info": {
    "phone": "(11) 9876-5432",
    "email": "anexo@workspace.com",
    "manager": "Maria Souza"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 📋 Passos para Popular Manualmente:

1. **Acesse o Firebase Console:** https://console.firebase.google.com/project/workspace-booking-system
2. **Vá para Authentication > Users > Add User**
3. **Crie os usuários admin e user**
4. **Vá para Firestore Database**
5. **Crie as coleções e documentos conforme os dados acima**

## 🔗 Links Úteis:

- **Firebase Console:** https://console.firebase.google.com/project/workspace-booking-system
- **Firestore Database:** https://console.firebase.google.com/project/workspace-booking-system/firestore
- **Authentication:** https://console.firebase.google.com/project/workspace-booking-system/authentication
- **Aplicação:** https://workspace-booking-system.web.app
