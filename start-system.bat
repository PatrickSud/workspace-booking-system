@echo off
echo ========================================
echo   WORKSPACE BOOKING SYSTEM
echo ========================================
echo.
echo Iniciando sistema...
echo.

echo [1/3] Iniciando Backend (Porta 3002)...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/3] Iniciando Frontend (Porta 3004)...
start "Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo [3/3] Sistema iniciado com sucesso!
echo.
echo ========================================
echo   URLs DE ACESSO:
echo ========================================
echo Frontend: http://localhost:3004
echo Backend:  http://localhost:3002/health
echo.
echo Pressione qualquer tecla para abrir o sistema...
pause >nul

start http://localhost:3004

echo.
echo Sistema aberto no navegador!
echo Mantenha estas janelas abertas para o sistema funcionar.
echo.
pause
