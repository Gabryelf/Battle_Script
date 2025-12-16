@echo off
chcp 65001
title BattleScript Server

echo ========================================
echo          BattleScript Server
echo ========================================
echo.

REM Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version

echo.

REM Проверка и установка зависимостей
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.

REM Проверка необходимых файлов
if not exist "server.js" (
    echo [ERROR] server.js not found
    pause
    exit /b 1
)

if not exist "config.js" (
    echo [ERROR] config.js not found
    pause
    exit /b 1
)

echo [OK] All required files found

echo.
echo ========================================
echo           Starting Server
echo ========================================
echo.
echo [INFO] Local: http://localhost:3000
echo [INFO] WebSocket: ws://localhost:3000
echo.
echo [INFO] Game mode: 1v1 Duel
echo [INFO] Spectators: Up to 20
echo [INFO] Turn time: 2 minutes
echo [INFO] Deck size: 30 cards
echo.
echo [INFO] Press Ctrl+C to stop server
echo ========================================
echo.

REM Запуск сервера
node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start
    pause
    exit /b 1
)

echo.
echo [INFO] Server stopped
pause