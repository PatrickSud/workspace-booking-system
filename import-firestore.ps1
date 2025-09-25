# Script PowerShell para importar dados
Write-Host "🚀 Importando dados para o Firestore..." -ForegroundColor Green

# Verificar se está logado no Firebase
Write-Host "Verificando login no Firebase..." -ForegroundColor Yellow
npx firebase projects:list

# Importar dados usando o arquivo JSON
Write-Host "Importando dados..." -ForegroundColor Yellow
npx firebase firestore:import firestore-data.json --project workspace-booking-system

Write-Host "✅ Dados importados com sucesso!" -ForegroundColor Green
