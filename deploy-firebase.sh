#!/bin/bash

# Script para fazer deploy do projeto no Firebase
# Execute: ./deploy-firebase.sh

echo "🚀 Iniciando deploy do projeto no Firebase..."

# Verificar se Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI não encontrado. Instalando..."
    npm install -g firebase-tools
fi

# Fazer login no Firebase (se necessário)
echo "🔐 Verificando login no Firebase..."
firebase login --no-localhost

# Instalar dependências das functions
echo "📦 Instalando dependências das functions..."
cd functions
npm install
cd ..

# Build do frontend
echo "🏗️ Fazendo build do frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy das functions
echo "☁️ Fazendo deploy das Firebase Functions..."
firebase deploy --only functions

# Deploy do hosting
echo "🌐 Fazendo deploy do Firebase Hosting..."
firebase deploy --only hosting

# Deploy das regras do Firestore
echo "🔒 Fazendo deploy das regras do Firestore..."
firebase deploy --only firestore:rules

# Deploy dos índices do Firestore
echo "📊 Fazendo deploy dos índices do Firestore..."
firebase deploy --only firestore:indexes

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Seu app está disponível em: https://SEU-PROJETO.web.app"
echo "📊 Console do Firebase: https://console.firebase.google.com/project/SEU-PROJETO"
