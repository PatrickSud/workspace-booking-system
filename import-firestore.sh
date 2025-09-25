# Script para importar dados usando Firebase CLI
echo "🚀 Importando dados para o Firestore..."

# Verificar se está logado no Firebase
firebase projects:list

# Importar dados usando o arquivo JSON
firebase firestore:import firestore-data.json --project workspace-booking-system

echo "✅ Dados importados com sucesso!"
