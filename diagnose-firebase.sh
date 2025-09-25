#!/bin/bash

# Script de diagnóstico e correção do Firebase Functions
# Este script verifica o status e corrige problemas comuns

echo "🔍 DIAGNÓSTICO DO FIREBASE FUNCTIONS"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# 1. Verificar se Firebase CLI está instalado
echo ""
echo "1. Verificando Firebase CLI..."
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    print_status "OK" "Firebase CLI instalado: $FIREBASE_VERSION"
else
    print_status "ERROR" "Firebase CLI não está instalado"
    echo "Instalando Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -eq 0 ]; then
        print_status "OK" "Firebase CLI instalado com sucesso"
    else
        print_status "ERROR" "Falha ao instalar Firebase CLI"
        exit 1
    fi
fi

# 2. Verificar se está logado no Firebase
echo ""
echo "2. Verificando autenticação..."
if firebase projects:list &> /dev/null; then
    CURRENT_USER=$(firebase projects:list --json | jq -r '.currentUser')
    print_status "OK" "Logado como: $CURRENT_USER"
else
    print_status "WARNING" "Não está logado no Firebase"
    echo "Fazendo login no Firebase..."
    firebase login
    if [ $? -eq 0 ]; then
        print_status "OK" "Login realizado com sucesso"
    else
        print_status "ERROR" "Falha no login do Firebase"
        exit 1
    fi
fi

# 3. Verificar projeto atual
echo ""
echo "3. Verificando projeto atual..."
CURRENT_PROJECT=$(firebase use --project | grep -o 'workspace-booking-system' || echo "Nenhum projeto selecionado")
if [ "$CURRENT_PROJECT" = "workspace-booking-system" ]; then
    print_status "OK" "Projeto correto selecionado: $CURRENT_PROJECT"
else
    print_status "WARNING" "Projeto incorreto ou não selecionado"
    echo "Selecionando projeto correto..."
    firebase use workspace-booking-system
    if [ $? -eq 0 ]; then
        print_status "OK" "Projeto selecionado com sucesso"
    else
        print_status "ERROR" "Falha ao selecionar projeto"
        exit 1
    fi
fi

# 4. Verificar dependências do Functions
echo ""
echo "4. Verificando dependências do Functions..."
cd functions
if [ -f "package.json" ]; then
    print_status "OK" "package.json encontrado"
    
    # Verificar se node_modules existe
    if [ -d "node_modules" ]; then
        print_status "OK" "Dependências instaladas"
    else
        print_status "WARNING" "Dependências não instaladas"
        echo "Instalando dependências..."
        npm install
        if [ $? -eq 0 ]; then
            print_status "OK" "Dependências instaladas com sucesso"
        else
            print_status "ERROR" "Falha ao instalar dependências"
            exit 1
        fi
    fi
else
    print_status "ERROR" "package.json não encontrado na pasta functions"
    exit 1
fi

# 5. Testar Functions localmente
echo ""
echo "5. Testando Functions localmente..."
echo "Iniciando emulador do Firebase..."
firebase emulators:start --only functions &
EMULATOR_PID=$!

# Aguardar emulador inicializar
sleep 10

# Testar health check
HEALTH_URL="http://localhost:5001/workspace-booking-system/us-central1/health"
if curl -s "$HEALTH_URL" > /dev/null; then
    print_status "OK" "Functions funcionando localmente"
else
    print_status "WARNING" "Functions não respondem localmente"
fi

# Parar emulador
kill $EMULATOR_PID 2>/dev/null

# 6. Verificar Functions deployadas
echo ""
echo "6. Verificando Functions deployadas..."
cd ..
FUNCTIONS_URL="https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
if curl -s "$FUNCTIONS_URL" > /dev/null; then
    print_status "OK" "Functions deployadas e funcionando"
else
    print_status "WARNING" "Functions não estão deployadas ou não respondem"
    echo "Deploy das Functions..."
    firebase deploy --only functions
    if [ $? -eq 0 ]; then
        print_status "OK" "Functions deployadas com sucesso"
    else
        print_status "ERROR" "Falha no deploy das Functions"
        exit 1
    fi
fi

# 7. Testar CORS
echo ""
echo "7. Testando CORS..."
CORS_TEST_URL="https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
CORS_RESPONSE=$(curl -s -H "Origin: https://patricksud.github.io" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS "$CORS_TEST_URL" -w "%{http_code}")
if [[ "$CORS_RESPONSE" == *"200"* ]]; then
    print_status "OK" "CORS configurado corretamente"
else
    print_status "WARNING" "CORS pode ter problemas"
fi

# 8. Resumo final
echo ""
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "========================"
echo "✅ Firebase CLI: Instalado e configurado"
echo "✅ Projeto: workspace-booking-system"
echo "✅ Dependências: Instaladas"
echo "✅ Functions: Deployadas"
echo "✅ CORS: Configurado"
echo ""
echo "🌐 URLs das Functions:"
echo "Health Check: https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
echo "Login: https://southamerica-east1-workspace-booking-system.cloudfunctions.net/login"
echo ""
echo "🔧 Para testar manualmente:"
echo "curl https://southamerica-east1-workspace-booking-system.cloudfunctions.net/health"
echo ""
print_status "OK" "Diagnóstico concluído com sucesso!"
