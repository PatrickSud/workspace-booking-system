#!/bin/bash

echo "🚀 Populando banco de dados via Firebase Emulator..."

# Iniciar emulador em background
firebase emulators:start --only firestore &
EMULATOR_PID=$!

# Aguardar emulador inicializar
sleep 10

# Importar dados
firebase emulators:exec --only firestore "node quick-seed.js"

# Parar emulador
kill $EMULATOR_PID

echo "✅ Dados importados com sucesso!"
