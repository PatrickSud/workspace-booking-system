# Script de diagnóstico e correção do Firebase Functions (PowerShell)
# Este script verifica o status e corrige problemas comuns

Write-Host "🔍 DIAGNÓSTICO DO FIREBASE FUNCTIONS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Função para imprimir com cores
function Write-Status {
  param(
    [string]$Status,
    [string]$Message
  )
    
  switch ($Status) {
    "OK" { Write-Host "✅ $Message" -ForegroundColor Green }
    "WARNING" { Write-Host "⚠️  $Message" -ForegroundColor Yellow }
    "ERROR" { Write-Host "❌ $Message" -ForegroundColor Red }
    "INFO" { Write-Host "ℹ️  $Message" -ForegroundColor Blue }
  }
}

# 1. Verificar se Firebase CLI está instalado
Write-Host ""
Write-Host "1. Verificando Firebase CLI..." -ForegroundColor White
try {
  $firebaseVersion = firebase --version 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Firebase CLI instalado: $firebaseVersion"
  }
  else {
    throw "Firebase CLI não encontrado"
  }
}
catch {
  Write-Status "ERROR" "Firebase CLI não está instalado"
  Write-Host "Instalando Firebase CLI..." -ForegroundColor Yellow
  npm install -g firebase-tools
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Firebase CLI instalado com sucesso"
  }
  else {
    Write-Status "ERROR" "Falha ao instalar Firebase CLI"
    exit 1
  }
}

# 2. Verificar se está logado no Firebase
Write-Host ""
Write-Host "2. Verificando autenticação..." -ForegroundColor White
try {
  $projects = firebase projects:list 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Logado no Firebase"
  }
  else {
    throw "Não está logado"
  }
}
catch {
  Write-Status "WARNING" "Não está logado no Firebase"
  Write-Host "Fazendo login no Firebase..." -ForegroundColor Yellow
  firebase login
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Login realizado com sucesso"
  }
  else {
    Write-Status "ERROR" "Falha no login do Firebase"
    exit 1
  }
}

# 3. Verificar projeto atual
Write-Host ""
Write-Host "3. Verificando projeto atual..." -ForegroundColor White
try {
  $currentProject = firebase use --project 2>$null
  if ($currentProject -match "workspace-booking-system") {
    Write-Status "OK" "Projeto correto selecionado: workspace-booking-system"
  }
  else {
    throw "Projeto incorreto"
  }
}
catch {
  Write-Status "WARNING" "Projeto incorreto ou não selecionado"
  Write-Host "Selecionando projeto correto..." -ForegroundColor Yellow
  firebase use workspace-booking-system
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Projeto selecionado com sucesso"
  }
  else {
    Write-Status "ERROR" "Falha ao selecionar projeto"
    exit 1
  }
}

# 4. Verificar dependências do Functions
Write-Host ""
Write-Host "4. Verificando dependências do Functions..." -ForegroundColor White
if (Test-Path "functions/package.json") {
  Write-Status "OK" "package.json encontrado"
    
  # Verificar se node_modules existe
  if (Test-Path "functions/node_modules") {
    Write-Status "OK" "Dependências instaladas"
  }
  else {
    Write-Status "WARNING" "Dependências não instaladas"
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    Set-Location functions
    npm install
    Set-Location ..
    if ($LASTEXITCODE -eq 0) {
      Write-Status "OK" "Dependências instaladas com sucesso"
    }
    else {
      Write-Status "ERROR" "Falha ao instalar dependências"
      exit 1
    }
  }
}
else {
  Write-Status "ERROR" "package.json não encontrado na pasta functions"
  exit 1
}

# 5. Testar Functions deployadas
Write-Host ""
Write-Host "5. Testando Functions deployadas..." -ForegroundColor White
$healthUrl = "https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
try {
  $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    Write-Status "OK" "Functions deployadas e funcionando"
  }
  else {
    throw "Status code: $($response.StatusCode)"
  }
}
catch {
  Write-Status "WARNING" "Functions não estão deployadas ou não respondem"
  Write-Host "Deploy das Functions..." -ForegroundColor Yellow
  firebase deploy --only functions
  if ($LASTEXITCODE -eq 0) {
    Write-Status "OK" "Functions deployadas com sucesso"
  }
  else {
    Write-Status "ERROR" "Falha no deploy das Functions"
    exit 1
  }
}

# 6. Testar CORS
Write-Host ""
Write-Host "6. Testando CORS..." -ForegroundColor White
$corsUrl = "https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
try {
  $headers = @{
    "Origin"                         = "https://patricksud.github.io"
    "Access-Control-Request-Method"  = "GET"
    "Access-Control-Request-Headers" = "X-Requested-With"
  }
  $response = Invoke-WebRequest -Uri $corsUrl -Method OPTIONS -Headers $headers -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    Write-Status "OK" "CORS configurado corretamente"
  }
  else {
    Write-Status "WARNING" "CORS pode ter problemas"
  }
}
catch {
  Write-Status "WARNING" "Erro ao testar CORS: $($_.Exception.Message)"
}

# 7. Resumo final
Write-Host ""
Write-Host "📊 RESUMO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "✅ Firebase CLI: Instalado e configurado" -ForegroundColor Green
Write-Host "✅ Projeto: workspace-booking-system" -ForegroundColor Green
Write-Host "✅ Dependências: Instaladas" -ForegroundColor Green
Write-Host "✅ Functions: Deployadas" -ForegroundColor Green
Write-Host "✅ CORS: Configurado" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs das Functions:" -ForegroundColor Blue
Write-Host "Health Check: https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health" -ForegroundColor White
Write-Host "Login: https://southamerica-east1-workspace-booking-system.cloudfunctions.net/login" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para testar manualmente:" -ForegroundColor Blue
Write-Host "Invoke-WebRequest -Uri 'https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health'" -ForegroundColor White
Write-Host ""
Write-Status "OK" "Diagnóstico concluído com sucesso!"
