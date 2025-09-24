@echo off
echo ========================================
echo  Setup do Sistema de Reserva de Espacos
echo ========================================
echo.

echo IMPORTANTE: Execute este script na pasta raiz do projeto!
echo Pasta atual: %CD%
echo.

if not exist "backend\package.json" (
    echo ERRO: Arquivo backend\package.json nao encontrado!
    echo Certifique-se de estar na pasta workspace-booking-system
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERRO: Arquivo frontend\package.json nao encontrado!
    echo Certifique-se de estar na pasta workspace-booking-system
    pause
    exit /b 1
)

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js 18+ primeiro.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Instalando dependencias do BACKEND
echo ========================================
pushd backend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend
    popd
    pause
    exit /b 1
)
popd

echo.
echo ========================================
echo  Instalando dependencias do FRONTEND
echo ========================================
pushd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    popd
    pause
    exit /b 1
)
popd

echo.
echo ========================================
echo  INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Agora execute os comandos abaixo em terminais separados:
echo.
echo TERMINAL 1 (Backend):
echo   cd backend
echo   npm run seed
echo   npm run dev
echo.
echo TERMINAL 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Depois acesse: http://localhost:3000
echo.
pause
