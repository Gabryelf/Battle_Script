const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

class GameServer {
    constructor(port = 3000) {
        this.port = port;
        this.clients = new Map();
        
        // Расширенное состояние игры
        this.gameState = {
            teamA: { 
                players: [], 
                mana: 3, 
                maxMana: 3,
                health: 30, 
                hand: [], 
                board: [], 
                deck: [],
                cardsLoaded: false,
                readyForBattle: false,
                confirmedBattle: false
            },
            teamB: { 
                players: [], 
                mana: 3, 
                maxMana: 3,
                health: 30, 
                hand: [], 
                board: [], 
                deck: [],
                cardsLoaded: false,
                readyForBattle: false,
                confirmedBattle: false
            },
            currentTurn: 'A',
            turnNumber: 1,
            gameStarted: false,
            battlePhase: false,
            waitingForBattleConfirm: true,
            cards: { teamA: [], teamB: [] },
            battleConfirmed: { teamA: false, teamB: false },
            turnTimer: null,
            turnTimeLimit: 120000 // 2 минуты
        };
        
        this.setupServer();
    }
    
    setupServer() {
        this.server = http.createServer((req, res) => {
            this.serveStaticFile(req, res);
        });
        
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            console.log(`Новое подключение: ${clientId} (${req.socket.remoteAddress})`);
            
            this.clients.set(clientId, {
                ws,
                team: null,
                name: 'Игрок',
                id: clientId,
                ip: req.socket.remoteAddress,
                lastActivity: Date.now()
            });
            
            // Отправляем текущее состояние
            ws.send(JSON.stringify({
                type: 'init',
                gameState: this.getPublicGameState(),
                clientId
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                    
                    // Обновляем время последней активности
                    const client = this.clients.get(clientId);
                    if (client) client.lastActivity = Date.now();
                } catch (error) {
                    console.error('Ошибка обработки сообщения:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`Отключение: ${clientId}`);
                this.handleDisconnect(clientId);
            });
            
            ws.on('error', (error) => {
                console.error(`Ошибка WebSocket для клиента ${clientId}:`, error);
            });
        });
        
        // Запускаем таймер для проверки активности
        setInterval(() => this.checkInactiveClients(), 60000); // Каждую минуту
        
        // Запускаем таймер для автоматического завершения хода
        setInterval(() => this.checkTurnTimeout(), 10000); // Проверка каждые 10 секунд
        
        this.server.listen(this.port, () => {
            console.log(`\n=== BattleScript Server ===`);
            console.log(`Сервер запущен на порту ${this.port}`);
            console.log(`Доступен по адресу:`);
            console.log(`  http://localhost:${this.port}`);
            console.log(`  ws://localhost:${this.port}/ws`);
            
            // Показываем локальные IP
            const os = require('os');
            const interfaces = os.networkInterfaces();
            
            console.log(`\nДругие доступные адреса:`);
            let hasExternal = false;
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        console.log(`  http://${iface.address}:${this.port}`);
                        hasExternal = true;
                    }
                }
            }
            
            if (!hasExternal) {
                console.log(`  (Только локальный доступ - проверьте настройки сети)`);
            }
            
            console.log(`\n=== Правила игры ===`);
            console.log(`1. Игроки загружают карты для своей команды`);
            console.log(`2. Обе команды подтверждают готовность к бою`);
            console.log(`3. Игра начинается!`);
            console.log(`4. Ход длится 2 минуты или до пропуска хода`);
            console.log(`5. Существа атакуют по особым правилам:`);
            console.log(`   - Приоритет: Провокация > Герой напротив > Рандомный враг`);
            console.log(`   - Прорыв: два удара с контратакой от первого`);
            console.log(`   - Площадная атака: по 3 целям`);
            console.log(`   - Стрелки: атакуют героя, контратакуют летунов`);
            console.log(`   - Летуны: без контратаки, кроме стрелков`);
            console.log(`\nДля начала игры обе команды должны загрузить карты и подтвердить бой!\n`);
        });
        
        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Порт ${this.port} уже занят!`);
                console.error(`Используйте другой порт или завершите процесс, использующий порт ${this.port}`);
            } else {
                console.error('Ошибка сервера:', error);
            }
        });
    }
    
    serveStaticFile(req, res) {
        let filePath = '.' + req.url;
        
        if (filePath === './') {
            filePath = './index.html';
        }
        
        if (req.url === '/ws' || req.url === '/ws/') {
            res.writeHead(400);
            res.end('WebSocket endpoint');
            return;
        }
        
        const extname = path.extname(filePath);
        let contentType = 'text/html';
        
        switch (extname) {
            case '.js':
                contentType = 'application/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.ico':
                contentType = 'image/x-icon';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
        }
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    if (filePath.endsWith('favicon.ico')) {
                        res.writeHead(204);
                        res.end();
                        return;
                    }
                    
                    // Пробуем найти файл
                    const possiblePaths = [
                        filePath,
                        './' + req.url,
                        './index.html',
                        filePath.replace('./', ''),
                        filePath.replace('./', '../'),
                        './public' + req.url
                    ];
                    
                    let found = false;
                    for (const altPath of possiblePaths) {
                        try {
                            if (fs.existsSync(altPath)) {
                                fs.readFile(altPath, (err, data) => {
                                    if (err) {
                                        res.writeHead(404);
                                        res.end('Файл не найден: ' + req.url);
                                    } else {
                                        res.writeHead(200, { 
                                            'Content-Type': contentType,
                                            'Cache-Control': 'no-cache'
                                        });
                                        res.end(data, 'utf-8');
                                    }
                                });
                                found = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (!found) {
                        if (req.url.match(/\.(html|htm)$/) || !req.url.includes('.')) {
                            fs.readFile('./index.html', (err, data) => {
                                if (err) {
                                    res.writeHead(404);
                                    res.end('Файл не найден');
                                } else {
                                    res.writeHead(200, { 
                                        'Content-Type': 'text/html',
                                        'Cache-Control': 'no-cache'
                                    });
                                    res.end(data, 'utf-8');
                                }
                            });
                        } else {
                            res.writeHead(404);
                            res.end('Файл не найден: ' + req.url);
                        }
                    }
                } else {
                    res.writeHead(500);
                    res.end('Ошибка сервера: ' + error.code);
                }
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache'
                });
                res.end(content, 'utf-8');
            }
        });
    }
    
    generateClientId() {
        return Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        console.log(`Сообщение от ${clientId} (${client.name}):`, data.type);
        
        switch (data.type) {
            case 'join_team':
                this.handleJoinTeam(clientId, data.team, data.playerName);
                break;
                
            case 'confirm_connection':
                this.handleConfirmConnection(clientId, data.team, data.playerName);
                break;
                
            case 'load_cards':
                this.handleLoadCards(clientId, data.team, data.cards);
                break;
                
            case 'confirm_battle':
                this.handleConfirmBattle(clientId);
                break;
                
            case 'start_game':
                this.handleStartGame(clientId);
                break;
                
            case 'play_card':
                this.handlePlayCard(clientId, data.cardId, data.target);
                break;
                
            case 'attack':
                this.handleAttack(clientId, data.attackerId, data.targetId, data.attackType);
                break;
                
            case 'auto_attack':
                this.handleAutoAttack(clientId);
                break;
                
            case 'end_turn':
                this.handleEndTurn(clientId);
                break;
                
            case 'skip_turn':
                this.handleEndTurn(clientId);
                break;
                
            case 'draw_card':
                this.handleDrawCard(clientId);
                break;
                
            case 'increase_mana':
                this.handleIncreaseMana(clientId);
                break;
                
            case 'chat_message':
                this.handleChatMessage(clientId, data.message);
                break;
                
            case 'ping':
                this.sendToClient(clientId, { type: 'pong' });
                break;
                
            default:
                console.log(`Неизвестный тип сообщения:`, data.type);
        }
    }
    
    handleJoinTeam(clientId, team, playerName) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        const oldTeam = client.team;
        
        // Удаляем из старой команды
        if (oldTeam) {
            this.gameState[`team${oldTeam}`].players = 
                this.gameState[`team${oldTeam}`].players.filter(p => p.id !== clientId);
        }
        
        // Добавляем в новую команду
        client.team = team;
        client.name = playerName || `Игрок ${team}`;
        
        this.gameState[`team${team}`].players.push({
            id: clientId,
            name: client.name,
            team: team,
            ip: client.ip
        });
        
        // Уведомляем всех
        this.broadcast({
            type: 'player_joined',
            player: { 
                id: clientId, 
                name: client.name, 
                team: team 
            },
            teams: {
                teamA: this.gameState.teamA.players.length,
                teamB: this.gameState.teamB.players.length
            },
            gameState: this.getPublicGameState()
        });
        
        console.log(`${client.name} присоединился к команде ${team}`);
        
        // Отправляем подтверждение
        this.sendToClient(clientId, {
            type: 'join_confirmed',
            team: team,
            playerName: client.name,
            clientId: clientId,
            gameState: this.getPublicGameState()
        });
    }
    
    handleConfirmConnection(clientId, team, playerName) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        if (!client.team && team) {
            this.handleJoinTeam(clientId, team, playerName);
        } else {
            this.sendToClient(clientId, {
                type: 'connection_confirmed',
                team: client.team,
                playerName: client.name,
                clientId: clientId,
                gameState: this.getPublicGameState()
            });
        }
    }
    
    handleLoadCards(clientId, team, cards) {
        const client = this.clients.get(clientId);
        if (!client || !team) return;
        
        if (client.team && client.team !== team) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Нельзя загружать карты не в свою команду'
            });
            return;
        }
        
        // Если клиент еще не в команде, добавляем его
        if (!client.team) {
            client.team = team;
            client.name = client.name || `Игрок ${team}`;
            this.gameState[`team${team}`].players.push({
                id: clientId,
                name: client.name,
                team: team,
                ip: client.ip
            });
        }
        
        // Загружаем карты в колоду
        this.gameState.cards[`team${team}`] = cards;
        this.gameState[`team${team}`].deck = [...cards];
        this.gameState[`team${team}`].cardsLoaded = true;
        
        console.log(`${client.name} загрузил ${cards.length} карт для команды ${team}`);
        
        // Перемешиваем колоду
        this.shuffleArray(this.gameState[`team${team}`].deck);
        
        // Раздаем начальные карты
        for (let i = 0; i < 3; i++) {
            this.drawCardForTeam(team);
        }
        
        // Уведомляем всех
        this.broadcast({
            type: 'cards_loaded',
            team: team,
            cardsCount: cards.length,
            player: client.name,
            gameState: this.getPublicGameState()
        });
        
        // Проверяем, можно ли начать игру
        this.checkBattleReady();
    }
    
    handleConfirmBattle(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        const team = client.team;
        this.gameState[`team${team}`].confirmedBattle = true;
        this.gameState.battleConfirmed[team] = true;
        
        console.log(`${client.name} подтвердил готовность к бою для команды ${team}`);
        
        // Уведомляем всех
        this.broadcast({
            type: 'battle_confirmed',
            team: team,
            player: client.name,
            gameState: this.getPublicGameState()
        });
        
        // Проверяем, можно ли начать игру
        this.checkBattleReady();
    }
    
    checkBattleReady() {
        const teamAReady = this.gameState.teamA.cardsLoaded && this.gameState.teamA.confirmedBattle;
        const teamBReady = this.gameState.teamB.cardsLoaded && this.gameState.teamB.confirmedBattle;
        
        if (teamAReady && teamBReady && !this.gameState.gameStarted) {
            this.startGame();
        } else {
            // Отправляем статус готовности
            this.broadcast({
                type: 'battle_status',
                teamA: {
                    cardsLoaded: this.gameState.teamA.cardsLoaded,
                    confirmed: this.gameState.teamA.confirmedBattle,
                    players: this.gameState.teamA.players.length
                },
                teamB: {
                    cardsLoaded: this.gameState.teamB.cardsLoaded,
                    confirmed: this.gameState.teamB.confirmedBattle,
                    players: this.gameState.teamB.players.length
                },
                message: `Ожидание готовности: ${teamAReady ? 'A готово' : 'A не готово'}, ${teamBReady ? 'B готово' : 'B не готово'}`
            });
        }
    }
    
    startGame() {
        this.gameState.gameStarted = true;
        this.gameState.battlePhase = true;
        this.gameState.waitingForBattleConfirm = false;
        this.gameState.currentTurn = 'A';
        this.gameState.turnNumber = 1;
        
        // Сбрасываем маны
        this.gameState.teamA.mana = 3;
        this.gameState.teamA.maxMana = 3;
        this.gameState.teamB.mana = 3;
        this.gameState.teamB.maxMana = 3;
        
        // Очищаем поля
        this.gameState.teamA.board = [];
        this.gameState.teamB.board = [];
        
        // Запускаем таймер хода
        this.startTurnTimer();
        
        console.log(`Игра начата! Первый ход у команды A`);
        
        // Уведомляем всех
        this.broadcast({
            type: 'game_started',
            currentTurn: 'A',
            turnNumber: 1,
            gameState: this.getPublicGameState(),
            message: 'Бой начался!'
        });
    }
    
    handleStartGame(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        // Проверяем условия
        const canStart = 
            this.gameState.teamA.cardsLoaded &&
            this.gameState.teamB.cardsLoaded &&
            this.gameState.teamA.players.length > 0 &&
            this.gameState.teamB.players.length > 0;
        
        if (!canStart) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Нельзя начать игру. Нужны карты и игроки в обеих командах.'
            });
            return;
        }
        
        this.startGame();
    }
    
    handlePlayCard(clientId, cardId, target) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сначала присоединитесь к команде'
            });
            return;
        }
        
        const team = client.team;
        const currentTurn = this.gameState.currentTurn;
        
        if (team !== currentTurn) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        // Находим карту в руке
        const teamState = this.gameState[`team${team}`];
        const cardIndex = teamState.hand.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Карта не найдена в руке'
            });
            return;
        }
        
        const card = teamState.hand[cardIndex];
        
        // Проверяем ману
        if (teamState.mana < card.cost) {
            this.sendToClient(clientId, {
                type: 'error',
                message: `Недостаточно маны. Нужно ${card.cost}, есть ${teamState.mana}`
            });
            return;
        }
        
        // Используем ману
        teamState.mana -= card.cost;
        
        // Убираем карту из руки
        teamState.hand.splice(cardIndex, 1);
        
        // Логика применения карты
        if (card.type === 'creature') {
            // Существо идет на поле
            const boardCard = {
                ...card,
                id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                canAttack: false,
                hasAttacked: false,
                hasStealth: card.abilities?.includes('Скрытность') || false,
                owner: clientId,
                position: teamState.board.length
            };
            
            teamState.board.push(boardCard);
            
            this.broadcast({
                type: 'creature_played',
                playerId: clientId,
                playerName: client.name,
                team: team,
                card: boardCard,
                mana: teamState.mana,
                boardCount: teamState.board.length
            });
            
            console.log(`${client.name} призвал существо: ${card.name}`);
            
        } else if (card.type === 'spell') {
            // Заклинание применяется сразу
            this.applySpell(card, team, target, client);
            
        } else if (card.type === 'artifact') {
            // Артефакт применяется на существо
            this.applyArtifact(card, team, target, client);
        }
        
        // Обновляем состояние
        this.broadcastGameState();
    }
    
    applySpell(spell, team, target, client) {
        const teamState = this.gameState[`team${team}`];
        const enemyTeam = team === 'A' ? 'B' : 'A';
        const enemyState = this.gameState[`team${enemyTeam}`];
        
        // Определяем тип заклинания
        const isHeal = spell.abilities?.includes('Целитель') || 
                      spell.description?.toLowerCase().includes('исцел');
        const isDamage = spell.attack > 0 && !isHeal;
        
        if (isHeal) {
            // Лечение
            if (target && target.type === 'creature') {
                const creature = teamState.board.find(c => c.id === target.id);
                if (creature) {
                    creature.health += spell.attack;
                    creature.maxHealth = Math.max(creature.maxHealth || 0, creature.health);
                }
            } else {
                // Лечим всех существ или героя
                if (spell.abilities?.includes('Площадной урон') || spell.target === 'all') {
                    teamState.board.forEach(creature => {
                        creature.health += spell.attack;
                        creature.maxHealth = Math.max(creature.maxHealth || 0, creature.health);
                    });
                } else {
                    // Лечим героя
                    teamState.health = Math.min(teamState.health + spell.attack, 30);
                }
            }
            
            this.broadcast({
                type: 'spell_played',
                playerId: client.id,
                playerName: client.name,
                team: team,
                card: spell,
                target: target,
                effect: 'heal',
                amount: spell.attack,
                mana: teamState.mana
            });
            
        } else if (isDamage) {
            // Урон
            let damageDone = 0;
            
            if (target && target.type === 'creature') {
                const creature = enemyState.board.find(c => c.id === target.id);
                if (creature) {
                    creature.health -= spell.attack;
                    damageDone = Math.min(spell.attack, creature.health + spell.attack);
                    if (creature.health <= 0) {
                        this.removeFromBoard(creature.id, enemyTeam);
                    }
                }
            } else if (spell.target === 'hero') {
                // Урон герою
                enemyState.health -= spell.attack;
                damageDone = spell.attack;
                
                if (enemyState.health <= 0) {
                    this.endGame(team);
                }
            } else if (spell.target === 'all') {
                // Урон всем существам
                enemyState.board.forEach(creature => {
                    creature.health -= spell.attack;
                    damageDone += Math.min(spell.attack, creature.health + spell.attack);
                });
                
                // Убираем мертвых существ
                enemyState.board = enemyState.board.filter(c => c.health > 0);
            } else if (spell.target === 'random') {
                // Урон случайным целям
                const count = Math.min(spell.attack, enemyState.board.length);
                for (let i = 0; i < count; i++) {
                    if (enemyState.board.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * enemyState.board.length);
                    const creature = enemyState.board[randomIndex];
                    creature.health -= 1;
                    damageDone += 1;
                    
                    if (creature.health <= 0) {
                        enemyState.board.splice(randomIndex, 1);
                    }
                }
            }
            
            this.broadcast({
                type: 'spell_played',
                playerId: client.id,
                playerName: client.name,
                team: team,
                card: spell,
                target: target,
                effect: 'damage',
                amount: spell.attack,
                damageDone: damageDone,
                mana: teamState.mana
            });
        }
        
        console.log(`${client.name} применил заклинание: ${spell.name}`);
    }
    
    applyArtifact(artifact, team, target, client) {
        const teamState = this.gameState[`team${team}`];
        
        if (target && target.type === 'creature') {
            const creature = teamState.board.find(c => c.id === target.id);
            if (creature) {
                // Применяем артефакт на существо
                creature.attack += artifact.attack || 0;
                creature.health += artifact.health || 0;
                creature.maxHealth += artifact.health || 0;
                
                // Добавляем способности
                if (artifact.abilities) {
                    creature.abilities = [...(creature.abilities || []), ...artifact.abilities];
                }
                
                // Уменьшаем постоянную ману
                teamState.maxMana -= artifact.cost || 1;
                teamState.mana = Math.min(teamState.mana, teamState.maxMana);
                
                this.broadcast({
                    type: 'artifact_played',
                    playerId: client.id,
                    playerName: client.name,
                    team: team,
                    card: artifact,
                    target: target,
                    effect: 'buff',
                    mana: teamState.mana,
                    maxMana: teamState.maxMana
                });
                
                console.log(`${client.name} применил артефакт: ${artifact.name} на ${creature.name}`);
            }
        }
    }
    
    handleAutoAttack(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        const team = client.team;
        const currentTurn = this.gameState.currentTurn;
        
        if (team !== currentTurn) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const teamState = this.gameState[`team${team}`];
        const enemyTeam = team === 'A' ? 'B' : 'A';
        const enemyState = this.gameState[`team${enemyTeam}`];
        
        let totalDamage = 0;
        let attacks = [];
        
        // Авто-атака всех существ
        teamState.board.forEach(attacker => {
            if (attacker.canAttack && !attacker.hasAttacked) {
                const attackResult = this.performAutoAttack(attacker, team, enemyTeam);
                if (attackResult) {
                    totalDamage += attackResult.damage || 0;
                    attacks.push({
                        attacker: attacker.name,
                        target: attackResult.targetName,
                        damage: attackResult.damage
                    });
                }
            }
        });
        
        this.broadcast({
            type: 'auto_attack',
            playerId: clientId,
            playerName: client.name,
            team: team,
            attacks: attacks,
            totalDamage: totalDamage,
            mana: teamState.mana
        });
        
        console.log(`${client.name} выполнил авто-атаку, нанесено урона: ${totalDamage}`);
        
        // Проверяем конец игры
        if (enemyState.health <= 0) {
            this.endGame(team);
        }
        
        this.broadcastGameState();
    }
    
    performAutoAttack(attacker, attackerTeam, defenderTeam) {
        const attackerState = this.gameState[`team${attackerTeam}`];
        const defenderState = this.gameState[`team${defenderTeam}`];
        
        // Находим цель согласно правилам
        let target = this.findAttackTarget(attacker, attackerTeam, defenderTeam);
        
        if (!target) return null;
        
        // Выполняем атаку
        const result = this.executeAttack(attacker, target, attackerTeam, defenderTeam);
        
        // Помечаем, что атаковал
        attacker.hasAttacked = true;
        attacker.canAttack = false;
        
        // Если было скрытность - снимаем
        if (attacker.hasStealth) {
            attacker.hasStealth = false;
        }
        
        return result;
    }
    
    findAttackTarget(attacker, attackerTeam, defenderTeam) {
        const defenderState = this.gameState[`team${defenderTeam}`];
        
        // 1. Проверяем провокацию
        const tauntCreatures = defenderState.board.filter(c => 
            c.abilities?.includes('Провокация')
        );
        
        if (tauntCreatures.length > 0) {
            // Если стрелок - игнорируем провокацию для атаки героя
            if (attacker.abilities?.includes('Стрелок')) {
                // Стрелок может атаковать героя, если нет летунов
                const flyers = defenderState.board.filter(c => 
                    c.abilities?.includes('Полет')
                );
                if (flyers.length === 0) {
                    return { type: 'hero', name: 'Герой', health: defenderState.health };
                }
                // Атакуем летуна
                return flyers[Math.floor(Math.random() * flyers.length)];
            }
            return tauntCreatures[Math.floor(Math.random() * tauntCreatures.length)];
        }
        
        // 2. Если стрелок - атакует героя (или летунов)
        if (attacker.abilities?.includes('Стрелок')) {
            const flyers = defenderState.board.filter(c => 
                c.abilities?.includes('Полет')
            );
            if (flyers.length > 0) {
                return flyers[Math.floor(Math.random() * flyers.length)];
            }
            return { type: 'hero', name: 'Герой', health: defenderState.health };
        }
        
        // 3. Если летун - ищем не стрелков
        if (attacker.abilities?.includes('Полет')) {
            const nonArchers = defenderState.board.filter(c => 
                !c.abilities?.includes('Стрелок')
            );
            if (nonArchers.length > 0) {
                return nonArchers[Math.floor(Math.random() * nonArchers.length)];
            }
            return { type: 'hero', name: 'Герой', health: defenderState.health };
        }
        
        // 4. Если есть враги напротив
        const attackerIndex = this.gameState[`team${attackerTeam}`].board.indexOf(attacker);
        if (attackerIndex < defenderState.board.length) {
            const oppositeCreature = defenderState.board[attackerIndex];
            if (oppositeCreature) {
                return oppositeCreature;
            }
        }
        
        // 5. Случайный враг
        if (defenderState.board.length > 0) {
            return defenderState.board[Math.floor(Math.random() * defenderState.board.length)];
        }
        
        // 6. Герой
        return { type: 'hero', name: 'Герой', health: defenderState.health };
    }
    
    executeAttack(attacker, target, attackerTeam, defenderTeam) {
        const attackerState = this.gameState[`team${attackerTeam}`];
        const defenderState = this.gameState[`team${defenderTeam}`];
        
        let damageDealt = 0;
        let targetName = target.name || target.type;
        
        if (target.type === 'hero') {
            // Атака героя
            const damage = attacker.attack;
            defenderState.health -= damage;
            damageDealt = damage;
            
            this.broadcast({
                type: 'attack',
                attackerId: attacker.id,
                attackerName: attacker.name,
                targetId: 'hero',
                targetName: 'Герой',
                damage: damage,
                targetHealth: defenderState.health
            });
            
        } else {
            // Атака существа
            const creature = target;
            
            // Проверяем прорыв
            const isBreakthrough = attacker.abilities?.includes('Прорыв');
            const isAreaAttack = attacker.abilities?.includes('Площадной урон');
            
            if (isAreaAttack) {
                // Площадная атака
                const attackerIndex = attackerState.board.indexOf(attacker);
                const targets = [];
                
                // Цели: позиция напротив и соседние
                for (let i = -1; i <= 1; i++) {
                    const targetIndex = attackerIndex + i;
                    if (targetIndex >= 0 && targetIndex < defenderState.board.length) {
                        targets.push(defenderState.board[targetIndex]);
                    }
                }
                
                // Атакуем все цели
                targets.forEach(t => {
                    const damage = attacker.attack;
                    t.health -= damage;
                    damageDealt += Math.min(damage, t.health + damage);
                    
                    // Контратака только от цели напротив
                    if (t === creature && !attacker.abilities?.includes('Полет')) {
                        attacker.health -= t.attack;
                    }
                    
                    if (t.health <= 0) {
                        this.removeFromBoard(t.id, defenderTeam);
                    }
                });
                
            } else if (isBreakthrough) {
                // Прорыв: два удара
                const firstDamage = attacker.attack;
                creature.health -= firstDamage;
                damageDealt += Math.min(firstDamage, creature.health + firstDamage);
                
                // Контратака от первого удара
                if (!attacker.abilities?.includes('Полет')) {
                    attacker.health -= creature.attack;
                }
                
                // Второй удар (без контратаки, если враг не страж)
                const secondDamage = attacker.attack;
                if (creature.health > 0) {
                    creature.health -= secondDamage;
                    damageDealt += Math.min(secondDamage, creature.health + secondDamage);
                }
                
                if (creature.health <= 0) {
                    this.removeFromBoard(creature.id, defenderTeam);
                }
                
            } else {
                // Обычная атака
                const damage = attacker.attack;
                creature.health -= damage;
                damageDealt = Math.min(damage, creature.health + damage);
                
                // Контратака
                if (creature.health > 0 && !attacker.abilities?.includes('Полет')) {
                    attacker.health -= creature.attack;
                }
                
                if (creature.health <= 0) {
                    this.removeFromBoard(creature.id, defenderTeam);
                }
            }
            
            this.broadcast({
                type: 'attack',
                attackerId: attacker.id,
                attackerName: attacker.name,
                targetId: creature.id,
                targetName: creature.name,
                damage: damageDealt,
                targetHealth: creature.health
            });
        }
        
        // Проверяем смерть атакующего
        if (attacker.health <= 0) {
            this.removeFromBoard(attacker.id, attackerTeam);
        }
        
        return {
            targetName: targetName,
            damage: damageDealt
        };
    }
    
    handleEndTurn(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        const team = client.team;
        const currentTurn = this.gameState.currentTurn;
        
        if (team !== currentTurn) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        this.nextTurn();
    }
    
    handleDrawCard(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        const team = client.team;
        const currentTurn = this.gameState.currentTurn;
        
        if (team !== currentTurn) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const teamState = this.gameState[`team${team}`];
        
        // Проверяем ману для взятия карты
        const drawCost = 1 + (teamState.hand.length * 0.5); // Увеличивается с каждой картой
        if (teamState.mana < drawCost) {
            this.sendToClient(clientId, {
                type: 'error',
                message: `Недостаточно маны для взятия карты. Нужно ${Math.ceil(drawCost)}`
            });
            return;
        }
        
        // Берем карту
        const card = this.drawCardForTeam(team);
        if (card) {
            teamState.mana -= Math.ceil(drawCost);
            
            this.broadcast({
                type: 'card_drawn',
                playerId: clientId,
                playerName: client.name,
                team: team,
                card: card,
                mana: teamState.mana
            });
            
            console.log(`${client.name} взял карту: ${card.name}`);
        }
        
        this.broadcastGameState();
    }
    
    handleIncreaseMana(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.team) return;
        
        const team = client.team;
        const currentTurn = this.gameState.currentTurn;
        
        if (team !== currentTurn) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const teamState = this.gameState[`team${team}`];
        
        // Увеличиваем максимальную ману
        teamState.maxMana += 1;
        teamState.mana = teamState.maxMana;
        
        this.broadcast({
            type: 'mana_increased',
            playerId: clientId,
            playerName: client.name,
            team: team,
            maxMana: teamState.maxMana,
            mana: teamState.mana
        });
        
        console.log(`${client.name} увеличил ману до ${teamState.maxMana}`);
        
        this.broadcastGameState();
    }
    
    nextTurn() {
        // Останавливаем текущий таймер
        if (this.gameState.turnTimer) {
            clearTimeout(this.gameState.turnTimer);
        }
        
        // Меняем ход
        this.gameState.currentTurn = this.gameState.currentTurn === 'A' ? 'B' : 'A';
        
        // Увеличиваем номер хода если вернулись к команде A
        if (this.gameState.currentTurn === 'A') {
            this.gameState.turnNumber++;
        }
        
        const newTeam = this.gameState.currentTurn;
        const newTeamState = this.gameState[`team${newTeam}`];
        
        // Восстанавливаем ману
        newTeamState.mana = newTeamState.maxMana;
        
        // Сбрасываем статус атаки существ
        newTeamState.board.forEach(creature => {
            creature.canAttack = true;
            // Существа со скрытностью остаются скрытыми, пока не атакуют
            if (creature.hasStealth && creature.hasAttacked) {
                creature.hasStealth = false;
            }
        });
        
        // Лечение существ-целителей
        this.processHealers(newTeam);
        
        // Обработка яда
        this.processPoison(newTeam === 'A' ? 'B' : 'A');
        
        // Запускаем таймер для нового хода
        this.startTurnTimer();
        
        // Уведомляем всех
        this.broadcast({
            type: 'turn_changed',
            currentTurn: this.gameState.currentTurn,
            turnNumber: this.gameState.turnNumber,
            gameState: this.getPublicGameState(),
            message: `Ход команды ${newTeam}`
        });
        
        console.log(`Ход перешел команде ${newTeam} (ход ${this.gameState.turnNumber})`);
    }
    
    processHealers(team) {
        const teamState = this.gameState[`team${team}`];
        const healers = teamState.board.filter(c => 
            c.abilities?.includes('Целитель')
        );
        
        healers.forEach(healer => {
            const positions = teamState.board.length;
            let healAmount = 0;
            
            // Количество ячеек с союзниками (исключая самого целителя)
            const allyCells = positions - 1;
            
            if (allyCells >= 4) {
                healAmount = 1;
            } else if (allyCells === 3) {
                healAmount = 2;
            } else if (allyCells <= 2) {
                healAmount = 3;
            }
            
            // Лечим всех союзников
            teamState.board.forEach(creature => {
                if (creature !== healer) {
                    creature.health = Math.min(creature.health + healAmount, creature.maxHealth);
                }
            });
            
            // Также лечим героя
            teamState.health = Math.min(teamState.health + healAmount, 30);
        });
    }
    
    processPoison(team) {
        const teamState = this.gameState[`team${team}`];
        
        teamState.board.forEach(creature => {
            if (creature.poisoned) {
                creature.health -= 1;
                if (creature.health <= 0) {
                    this.removeFromBoard(creature.id, team);
                }
            }
        });
    }
    
    drawCardForTeam(team) {
        const teamState = this.gameState[`team${team}`];
        
        if (teamState.deck.length > 0) {
            const card = teamState.deck.shift();
            teamState.hand.push(card);
            return card;
        }
        
        // Если колода пуста, герой теряет здоровье
        teamState.health -= 1;
        
        if (teamState.health <= 0) {
            this.endGame(team === 'A' ? 'B' : 'A');
        }
        
        return null;
    }
    
    removeFromBoard(cardId, team) {
        const teamState = this.gameState[`team${team}`];
        const index = teamState.board.findIndex(c => c.id === cardId);
        if (index !== -1) {
            teamState.board.splice(index, 1);
            
            // Обновляем позиции оставшихся существ
            teamState.board.forEach((creature, idx) => {
                creature.position = idx;
            });
        }
    }
    
    startTurnTimer() {
        if (this.gameState.turnTimer) {
            clearTimeout(this.gameState.turnTimer);
        }
        
        this.gameState.turnTimer = setTimeout(() => {
            console.log(`Время хода команды ${this.gameState.currentTurn} истекло`);
            this.nextTurn();
        }, this.gameState.turnTimeLimit);
    }
    
    checkTurnTimeout() {
        if (this.gameState.gameStarted) {
            // Можно добавить дополнительные проверки таймаута
            const currentTime = Date.now();
            // Проверяем активность игроков текущей команды
        }
    }
    
    checkInactiveClients() {
        const now = Date.now();
        const inactiveTime = 5 * 60 * 1000; // 5 минут
        
        this.clients.forEach((client, clientId) => {
            if (now - client.lastActivity > inactiveTime) {
                console.log(`Клиент ${clientId} неактивен более 5 минут, отключаем`);
                client.ws.close();
            }
        });
    }
    
    handleChatMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        if (message.length > 500) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сообщение слишком длинное'
            });
            return;
        }
        
        const cleanMessage = message.toString().substring(0, 500);
        
        this.broadcast({
            type: 'chat_message',
            playerId: clientId,
            playerName: client.name,
            team: client.team,
            message: cleanMessage,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Чат от ${client.name}: ${cleanMessage.substring(0, 50)}...`);
    }
    
    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        if (client.team) {
            this.gameState[`team${client.team}`].players = 
                this.gameState[`team${client.team}`].players.filter(p => p.id !== clientId);
        }
        
        this.clients.delete(clientId);
        
        console.log(`${client.name || 'Игрок'} отключился`);
        
        this.broadcast({
            type: 'player_left',
            playerId: clientId,
            playerName: client.name,
            team: client.team,
            teams: {
                teamA: this.gameState.teamA.players.length,
                teamB: this.gameState.teamB.players.length
            },
            gameState: this.getPublicGameState()
        });
        
        // Если отключился последний игрок команды
        if (this.gameState.teamA.players.length === 0 || this.gameState.teamB.players.length === 0) {
            this.gameState.gameStarted = false;
            this.broadcast({
                type: 'game_paused',
                message: 'Игра приостановлена: недостаточно игроков'
            });
        }
    }
    
    endGame(winnerTeam) {
        this.gameState.gameStarted = false;
        
        if (this.gameState.turnTimer) {
            clearTimeout(this.gameState.turnTimer);
        }
        
        console.log(`Игра окончена! Победитель: Команда ${winnerTeam}`);
        
        this.broadcast({
            type: 'game_ended',
            winner: winnerTeam,
            message: `Победила команда ${winnerTeam}!`
        });
    }
    
    broadcast(message, excludeClientId = null) {
        const data = JSON.stringify(message);
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(data);
                } catch (error) {
                    console.error(`Ошибка отправки клиенту ${clientId}:`, error);
                }
            }
        });
    }
    
    broadcastGameState() {
        this.broadcast({
            type: 'game_state_update',
            gameState: this.getPublicGameState()
        });
    }
    
    broadcastToTeam(team, message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client, clientId) => {
            if (client.team === team && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(data);
                } catch (error) {
                    console.error(`Ошибка отправки клиенту ${clientId}:`, error);
                }
            }
        });
    }
    
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Ошибка отправки клиенту ${clientId}:`, error);
            }
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    getPublicGameState() {
        return {
            teamA: {
                players: this.gameState.teamA.players,
                mana: this.gameState.teamA.mana,
                maxMana: this.gameState.teamA.maxMana,
                health: this.gameState.teamA.health,
                hand: this.gameState.teamA.hand,
                board: this.gameState.teamA.board,
                deckSize: this.gameState.teamA.deck.length,
                cardsLoaded: this.gameState.teamA.cardsLoaded,
                confirmedBattle: this.gameState.teamA.confirmedBattle
            },
            teamB: {
                players: this.gameState.teamB.players,
                mana: this.gameState.teamB.mana,
                maxMana: this.gameState.teamB.maxMana,
                health: this.gameState.teamB.health,
                hand: this.gameState.teamB.hand,
                board: this.gameState.teamB.board,
                deckSize: this.gameState.teamB.deck.length,
                cardsLoaded: this.gameState.teamB.cardsLoaded,
                confirmedBattle: this.gameState.teamB.confirmedBattle
            },
            currentTurn: this.gameState.currentTurn,
            turnNumber: this.gameState.turnNumber,
            gameStarted: this.gameState.gameStarted,
            battlePhase: this.gameState.battlePhase,
            waitingForBattleConfirm: this.gameState.waitingForBattleConfirm
        };
    }
    
    getServerStats() {
        return {
            totalClients: this.clients.size,
            teamA: {
                players: this.gameState.teamA.players.length,
                cards: this.gameState.cards.teamA.length,
                ready: this.gameState.teamA.cardsLoaded && this.gameState.teamA.confirmedBattle
            },
            teamB: {
                players: this.gameState.teamB.players.length,
                cards: this.gameState.cards.teamB.length,
                ready: this.gameState.teamB.cardsLoaded && this.gameState.teamB.confirmedBattle
            },
            gameStarted: this.gameState.gameStarted,
            uptime: process.uptime()
        };
    }
}

// Запуск сервера
try {
    const server = new GameServer(3000);
    
    process.on('SIGINT', () => {
        console.log('\nЗавершение работы сервера...');
        server.broadcast({
            type: 'server_shutdown',
            message: 'Сервер завершает работу'
        });
        setTimeout(() => process.exit(0), 1000);
    });
    
    process.on('SIGTERM', () => {
        console.log('\nЗавершение работы сервера...');
        server.broadcast({
            type: 'server_shutdown',
            message: 'Сервер завершает работу'
        });
        setTimeout(() => process.exit(0), 1000);
    });
    
} catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
}