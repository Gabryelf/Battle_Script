@echo off
chcp 65001
title BattleScript Server v3.0

echo ========================================
echo        BattleScript Server v3.0
echo ========================================
echo.

REM Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не найден
    echo.
    echo Пожалуйста, установите Node.js с:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js найден
node --version

echo.

REM Проверка и установка зависимостей
if not exist "node_modules" (
    echo [INFO] Установка зависимостей...
    echo.
    call npm install ws
    if %errorlevel% neq 0 (
        echo [ERROR] Не удалось установить зависимости
        pause
        exit /b 1
    )
    echo [OK] Зависимости установлены
) else (
    echo [OK] Зависимости уже установлены
)

echo.

REM Проверка необходимых файлов
if not exist "server.js" (
    echo [ERROR] server.js не найден
    pause
    exit /b 1
)

if not exist "config.js" (
    echo [ERROR] config.js не найден
    pause
    exit /b 1
)

if not exist "client.js" (
    echo [ERROR] client.js не найден
    pause
    exit /b 1
)

if not exist "styles.css" (
    echo [ERROR] styles.css не найден
    pause
    exit /b 1
)

if not exist "index.html" (
    echo [ERROR] index.html не найден
    pause
    exit /b 1
)

echo [OK] Все необходимые файлы найдены

echo.
echo ========================================
echo         Запуск сервера v3.0
echo ========================================
echo.
echo [INFO] Локально: http://localhost:3000
echo [INFO] WebSocket: ws://localhost:3000
echo.
echo [INFO] Режим игры: 1 на 1 с аватарами
echo [INFO] Особенности:
echo [INFO]   • 6 аватаров с уникальными бонусами
echo [INFO]   • 5 ячеек на поле с особыми эффектами
echo [INFO]   • Карты заклинаний
echo [INFO]   • Система артефактов и квестов
echo [INFO]   • Время хода: 2 минуты
echo [INFO]   • Размер колоды: 30 карт
echo.
echo [INFO] Нажмите Ctrl+C для остановки сервера
echo ========================================
echo.

REM Запуск сервера
node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Не удалось запустить сервер
    pause
    exit /b 1
)

echo.
echo [INFO] Сервер остановлен
pause