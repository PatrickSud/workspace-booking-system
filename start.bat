@echo off
echo ========================================
echo  Sistema de Reserva de Espacos
echo  Iniciando Backend e Frontend
echo ========================================
echo.

echo Verificando se o Node.js esta instalado...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js 18+ primeiro.
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Diretorio atual: %CD%
echo.

echo Instalando dependencias do backend...
if not exist "backend" (
    echo ERRO: Pasta 'backend' nao encontrada no diretorio atual.
    echo Certifique-se de executar o script na pasta raiz do projeto.
    pause
    exit /b 1
)

cd /d "%~dp0backend"
echo Navegando para: %CD%
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend
    pause
    exit /b 1
)

echo.
echo Instalando dependencias do frontend...
cd /d "%~dp0frontend"
echo Navegando para: %CD%
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Instalacao concluida!
echo ========================================
echo.
echo IMPORTANTE: Antes de continuar, certifique-se de que:
echo 1. PostgreSQL esta instalado e rodando
echo 2. Banco 'workspace_booking' foi criado
echo 3. Configuracoes no backend/.env estao corretas
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo Executando seed do banco de dados...
cd /d "%~dp0backend"
echo Executando seed em: %CD%
call npm run seed
if %errorlevel% neq 0 (
    echo AVISO: Falha no seed. Verifique a conexao com o banco.
    echo Continuando mesmo assim...
)

echo.
echo Iniciando servidores...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.

cd /d "%~dp0backend"
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo  Servidores iniciados!
echo ========================================
echo.
echo Aguarde alguns segundos e acesse:
echo http://localhost:3000
echo.
echo Credenciais de teste:
echo Admin: admin@workspace.com / admin123
echo Usuario: ana.silva@empresa.com / user123
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
