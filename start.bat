@echo off
echo Запуск BattleScript сервера...
echo.

cd /d "C:\Users\elf\Desktop\BattleScript"

echo Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Ошибка: Node.js не установлен!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo Проверка зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
) else (
    echo Зависимости уже установлены.
)

echo.
echo Запуск сервера...
echo Сервер будет доступен по следующим адресам:
echo   http://localhost:3000
echo   http://[ваш IP]:3000
echo.
echo Для остановки сервера нажмите Ctrl+C
echo.

node server/server.js

pause