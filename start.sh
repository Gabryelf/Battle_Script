#!/bin/bash
echo "Запуск BattleScript сервера..."
echo ""

cd "$(dirname "$0")"

echo "Проверка Node.js..."
node --version >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Ошибка: Node.js не установлен!"
    echo "Установите Node.js с https://nodejs.org/"
    exit 1
fi

echo "Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
else
    echo "Зависимости уже установлены."
fi

echo ""
echo "Запуск сервера..."
echo "Сервер будет доступен по следующим адресам:"
echo "  http://localhost:3000"
echo "  http://[ваш IP]:3000"
echo ""
echo "Для остановки сервера нажмите Ctrl+C"
echo ""

node server/server.js