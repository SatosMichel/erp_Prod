@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo Iniciando o ERP Enterprise Moderno (React + FastAPI)...

:: Inicia o Servidor API (Backend)
start "Enterprise API (FastAPI)" cmd /k "cd f:\projetos_program\erp_Prod\backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Inicia o Servidor Frontend (Vite)
start "Enterprise UI (React)" cmd /k "cd f:\projetos_program\erp_Prod\frontend && npm.cmd run dev"

:: Aguarda 4 segundos
timeout /t 4 /nobreak > NUL

:: Abre no navegador automaticamente (Vite URL)
echo Servidores inicializados. Abrindo no navegador...
start http://localhost:5173/

echo.
echo Mantenha estas tres janelas rodando no fundo. 
echo Feche-as para desplugar o ERP.
pause
