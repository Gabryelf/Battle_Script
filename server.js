const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;

// Используем конфиг из файла
let GameConfig;
try {
    GameConfig = require('./config.js');
} catch (error) {
    console.error('Ошибка загрузки конфигурации:', error);
    process.exit(1);
}

class BattleScriptServer {
    constructor(port = GameConfig.server.port) {
        this.port = port;
        this.clients = new Map();
        this.games = new Map();
        this.queuedPlayers = [];
        
        this.setupServer();
        this.setupCleanupInterval();
        
        console.log(`\n🎮 BattleScript Server v2.0`);
        console.log(`📊 Конфиг загружен: ${GameConfig.cards.length} карт`);
        console.log(`⚙️  Режим: 1 на 1, наблюдатели: ${GameConfig.game.maxSpectators}`);
    }
    
    setupServer() {
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        
        this.server.listen(this.port, () => {
            this.logServerInfo();
        });
    }
    
    handleHttpRequest(req, res) {
        // Базовый роутинг для статических файлов
        if (req.url === '/' || req.url === '/index.html') {
            this.serveFile(res, './index.html', 'text/html');
        } else if (req.url === '/styles.css') {
            this.serveFile(res, './styles.css', 'text/css');
        } else if (req.url === '/client.js') {
            this.serveFile(res, './client.js', 'application/javascript');
        } else if (req.url === '/config.js') {
            this.serveFile(res, './config.js', 'application/javascript');
        } else if (req.url === '/ws' || req.url === '/ws/') {
            res.writeHead(400);
            res.end('WebSocket endpoint');
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
    
    async serveFile(res, filePath, contentType) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        } catch (error) {
            res.writeHead(404);
            res.end('File not found');
        }
    }
    
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const ip = req.socket.remoteAddress;
        
        const client = {
            ws,
            id: clientId,
            ip,
            name: null,
            status: 'connected',
            type: 'spectator', // player | spectator
            gameId: null,
            lastActivity: Date.now(),
            heartbeatInterval: null
        };
        
        this.clients.set(clientId, client);
        
        console.log(`🔌 Подключение: ${clientId} (${ip})`);
        
        // Отправляем начальные данные
        this.sendToClient(clientId, {
            type: 'init',
            clientId,
            config: {
                game: GameConfig.game,
                cards: GameConfig.cards.length,
                abilities: Object.keys(GameConfig.abilities).length
            },
            serverInfo: {
                online: this.clients.size,
                games: this.games.size,
                queued: this.queuedPlayers.length
            }
        });
        
        // Настраиваем heartbeat
        client.heartbeatInterval = setInterval(() => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.ping();
            }
        }, GameConfig.server.heartbeatInterval);
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(clientId, message);
                client.lastActivity = Date.now();
            } catch (error) {
                console.error(`❌ Ошибка парсинга сообщения от ${clientId}:`, error);
            }
        });
        
        ws.on('close', () => {
            this.handleDisconnect(clientId);
        });
        
        ws.on('error', (error) => {
            console.error(`❌ WebSocket ошибка (${clientId}):`, error);
            this.handleDisconnect(clientId);
        });
        
        ws.on('pong', () => {
            client.lastActivity = Date.now();
        });
    }
    
    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        console.log(`📨 ${clientId} (${client.name || 'unnamed'}): ${data.type}`);
        
        switch (data.type) {
            case 'set_name':
                this.handleSetName(clientId, data.name);
                break;
                
            case 'join_queue':
                this.handleJoinQueue(clientId);
                break;
                
            case 'leave_queue':
                this.handleLeaveQueue(clientId);
                break;
                
            case 'join_spectator':
                this.handleJoinSpectator(clientId, data.gameId);
                break;
                
            case 'play_card':
                this.handlePlayCard(clientId, data.cardId, data.target);
                break;
                
            case 'attack':
                this.handleAttack(clientId, data.attackerId, data.targetId);
                break;
                
            case 'auto_attack':
                this.handleAutoAttack(clientId);
                break;
                
            case 'end_turn':
                this.handleEndTurn(clientId);
                break;
                
            case 'draw_card':
                this.handleDrawCard(clientId);
                break;
                
            case 'chat_message':
                this.handleChatMessage(clientId, data.message);
                break;
                
            case 'surrender':
                this.handleSurrender(clientId);
                break;
                
            case 'ping':
                this.sendToClient(clientId, { type: 'pong' });
                break;
                
            // DEBUG команда
            case 'debug_state':
                this.handleDebugState(clientId);
                break;
                
            default:
                console.warn(`⚠️ Неизвестный тип сообщения от ${clientId}:`, data.type);
        }
    }
    
    handleSetName(clientId, name) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Очищаем и обрезаем имя
        name = name.toString().trim().substring(0, 20);
        if (!name) name = `Игрок_${Math.floor(Math.random() * 1000)}`;
        
        client.name = name;
        client.type = 'player';
        
        console.log(`👤 ${clientId} установил имя: ${name}`);
        
        this.sendToClient(clientId, {
            type: 'name_set',
            name: client.name,
            clientId: client.id
        });
        
        this.broadcastServerInfo();
    }
    
    handleJoinQueue(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.name) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сначала установите имя'
            });
            return;
        }
        
        if (client.type !== 'player') {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Только игроки могут вставать в очередь'
            });
            return;
        }
        
        if (this.queuedPlayers.includes(clientId)) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Вы уже в очереди'
            });
            return;
        }
        
        this.queuedPlayers.push(clientId);
        client.status = 'queued';
        
        console.log(`⏳ ${client.name} встал в очередь (в очереди: ${this.queuedPlayers.length})`);
        
        this.sendToClient(clientId, {
            type: 'joined_queue',
            position: this.queuedPlayers.length,
            playerName: client.name
        });
        
        this.broadcastServerInfo();
        this.tryMatchPlayers();
    }
    
    handleLeaveQueue(clientId) {
        const index = this.queuedPlayers.indexOf(clientId);
        if (index !== -1) {
            this.queuedPlayers.splice(index, 1);
            
            const client = this.clients.get(clientId);
            if (client) {
                client.status = 'connected';
            }
            
            console.log(`🚫 ${client?.name || clientId} покинул очередь`);
            
            this.sendToClient(clientId, {
                type: 'left_queue'
            });
            
            this.broadcastServerInfo();
        }
    }
    
    tryMatchPlayers() {
        if (this.queuedPlayers.length >= 2) {
            const player1Id = this.queuedPlayers.shift();
            const player2Id = this.queuedPlayers.shift();
            
            const player1 = this.clients.get(player1Id);
            const player2 = this.clients.get(player2Id);
            
            if (player1 && player2 && 
                player1.ws.readyState === WebSocket.OPEN && 
                player2.ws.readyState === WebSocket.OPEN) {
                
                this.createGame(player1, player2);
            } else {
                // Если один из игроков отключился, возвращаем другого в очередь
                if (player1 && player1.ws.readyState === WebSocket.OPEN) {
                    this.queuedPlayers.unshift(player1Id);
                }
                if (player2 && player2.ws.readyState === WebSocket.OPEN) {
                    this.queuedPlayers.unshift(player2Id);
                }
            }
        }
    }
    
    createGame(player1, player2) {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Создаем колоды для игроков
        const player1Deck = GameConfig.createDeck();
        const player2Deck = GameConfig.createDeck();
        
        const game = {
            id: gameId,
            player1: {
                id: player1.id,
                name: player1.name,
                health: GameConfig.game.startingHealth,
                mana: GameConfig.game.startingMana,
                maxMana: GameConfig.game.startingMana,
                hand: [],
                board: [],
                deck: player1Deck,
                cardsPlayed: 0,
                canAttack: false
            },
            player2: {
                id: player2.id,
                name: player2.name,
                health: GameConfig.game.startingHealth,
                mana: GameConfig.game.startingMana,
                maxMana: GameConfig.game.startingMana,
                hand: [],
                board: [],
                deck: player2Deck,
                cardsPlayed: 0,
                canAttack: false
            },
            spectators: [],
            currentTurn: Math.random() > 0.5 ? player1.id : player2.id,
            turnNumber: 1,
            turnEndTime: null,
            status: 'starting',
            created: Date.now(),
            log: []
        };
        
        // Раздаем начальные карты
        for (let i = 0; i < GameConfig.game.initialHandSize; i++) {
            if (game.player1.deck.length > 0) {
                const card1 = game.player1.deck.shift();
                card1.instanceId = `${card1.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                game.player1.hand.push(card1);
            }
            if (game.player2.deck.length > 0) {
                const card2 = game.player2.deck.shift();
                card2.instanceId = `${card2.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                game.player2.hand.push(card2);
            }
        }
        
        this.games.set(gameId, game);
        
        // Назначаем игрокам игру
        player1.gameId = gameId;
        player1.status = 'in_game';
        player2.gameId = gameId;
        player2.status = 'in_game';
        
        console.log(`🎮 Создана игра ${gameId}: ${player1.name} vs ${player2.name}`);
        
        // НЕМЕДЛЕННО отправляем состояние игры игрокам
        this.sendGameStateToPlayers(gameId);
        
        // Отправляем сообщение о начале игры
        [player1.id, player2.id].forEach(playerId => {
            this.sendToClient(playerId, {
                type: 'game_started',
                gameId: gameId,
                gameState: this.getGameStateForPlayers(game),
                message: 'Игра началась!'
            });
        });
        
        this.broadcastServerInfo();
        
        // Начинаем первый ход с небольшой задержкой
        setTimeout(() => {
            this.startGameTurn(gameId);
        }, 2000);
    }
    
    startGameTurn(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        game.status = 'active';
        const currentPlayer = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        
        // Восстанавливаем ману
        currentPlayer.mana = currentPlayer.maxMana;
        currentPlayer.maxMana = Math.min(currentPlayer.maxMana + 1, GameConfig.game.maxMana);
        
        // Добавляем карту в руку
        if (currentPlayer.deck.length > 0) {
            const newCard = currentPlayer.deck.shift();
            newCard.instanceId = `${newCard.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            currentPlayer.hand.push(newCard);
            
            // Отправляем сообщение о новой карте
            this.sendToClient(currentPlayer.id, {
                type: 'card_added',
                card: newCard
            });
        }
        
        // Разрешаем атаку существам
        currentPlayer.board.forEach(creature => {
            creature.canAttack = true;
            creature.hasAttacked = false;
        });
        
        // Устанавливаем таймер хода
        game.turnEndTime = Date.now() + (GameConfig.game.turnDuration * 1000);
        
        // Обновляем состояние игры
        this.sendGameStateToPlayers(gameId);
        this.broadcastGameStateToSpectators(gameId);
        
        this.addGameLog(gameId, `Ход ${game.turnNumber}: ${currentPlayer.name}`);
        
        console.log(`🔄 Ход ${game.turnNumber} в игре ${gameId}: ${currentPlayer.name}`);
        
        // Отправляем сообщение о смене хода
        this.sendToAllInGame(gameId, {
            type: 'turn_changed',
            currentTurn: game.currentTurn,
            turnNumber: game.turnNumber,
            playerName: currentPlayer.name
        });
    }
    
    handlePlayCard(clientId, cardId, target) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        if (game.currentTurn !== clientId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const player = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        const cardIndex = player.hand.findIndex(card => card.instanceId === cardId);
        
        if (cardIndex === -1) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Карта не найдена'
            });
            return;
        }
        
        const card = player.hand[cardIndex];
        
        if (player.mana < card.cost) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Недостаточно маны'
            });
            return;
        }
        
        // Списание маны и удаление карты из руки
        player.mana -= card.cost;
        player.hand.splice(cardIndex, 1);
        player.cardsPlayed++;
        
        if (card.type === 'creature') {
            // Создаем существо на поле
            const creature = {
                ...card,
                currentHealth: card.health,
                maxHealth: card.health,
                canAttack: false, // Не может атаковать в тот же ход
                hasAttacked: false,
                owner: clientId
            };
            
            player.board.push(creature);
            
            this.addGameLog(game.id, `${player.name} призывает ${card.name}`);
            
        } else if (card.type === 'spell') {
            // Обработка заклинания
            this.handleSpell(card, player, game, target);
        }
        
        // Обновляем состояние
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'card_played',
            playerId: clientId,
            playerName: player.name,
            card: card,
            target: target
        });
    }
    
    handleSpell(spell, caster, game, target) {
        const opponent = caster.id === game.player1.id ? game.player2 : game.player1;
        
        if (spell.abilities?.includes('area')) {
            // Площадной урон
            opponent.board.forEach(creature => {
                creature.currentHealth -= spell.attack;
            });
            
            opponent.board = opponent.board.filter(creature => creature.currentHealth > 0);
            this.addGameLog(game.id, `${caster.name} применяет ${spell.name} (урон по площади)`);
            
        } else if (spell.abilities?.includes('healer')) {
            // Лечение
            caster.board.forEach(creature => {
                creature.currentHealth = Math.min(creature.currentHealth + spell.attack, creature.maxHealth);
            });
            
            caster.health = Math.min(caster.health + spell.attack, GameConfig.game.startingHealth);
            this.addGameLog(game.id, `${caster.name} применяет ${spell.name} (лечение)`);
            
        } else {
            // Обычный урон
            if (target && target.type === 'creature') {
                const creature = opponent.board.find(c => c.instanceId === target.id);
                if (creature) {
                    creature.currentHealth -= spell.attack;
                    if (creature.currentHealth <= 0) {
                        opponent.board = opponent.board.filter(c => c.instanceId !== target.id);
                    }
                    this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на ${creature.name}`);
                }
            } else {
                // Урон герою
                opponent.health -= spell.attack;
                this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на героя`);
            }
        }
        
        // Проверка победы
        if (opponent.health <= 0) {
            this.endGame(game.id, caster.id);
        }
    }
    
    handleAttack(clientId, attackerId, targetId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        if (game.currentTurn !== clientId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const player = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        const opponent = player.id === game.player1.id ? game.player2 : game.player1;
        
        const attacker = player.board.find(c => c.instanceId === attackerId);
        if (!attacker || !attacker.canAttack || attacker.hasAttacked) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Это существо не может атаковать'
            });
            return;
        }
        
        let target;
        
        if (targetId === 'hero') {
            target = { type: 'hero', health: opponent.health };
        } else {
            target = opponent.board.find(c => c.instanceId === targetId);
        }
        
        if (!target) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Цель не найдена'
            });
            return;
        }
        
        // Проверка способностей
        if (attacker.abilities?.includes('archer') && target.type !== 'hero') {
            const canAttack = target.abilities?.includes('flying');
            if (!canAttack) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Стрелок может атаковать только летающих или героя'
                });
                return;
            }
        }
        
        // Выполнение атаки
        const result = this.executeAttack(attacker, target, player, opponent, game);
        
        if (result) {
            attacker.hasAttacked = true;
            attacker.canAttack = false;
            
            this.addGameLog(game.id, 
                `${player.name}: ${attacker.name} атакует ${target.type === 'hero' ? 'героя' : target.name}`
            );
            
            // Обновляем состояние
            this.sendGameStateToPlayers(game.id);
            this.broadcastGameStateToSpectators(game.id);
            
            this.sendToAllInGame(game.id, {
                type: 'attack_executed',
                attacker: attacker.name,
                target: target.type === 'hero' ? 'Герой' : target.name,
                damage: result.damage
            });
            
            // Проверка победы
            if (opponent.health <= 0) {
                this.endGame(game.id, player.id);
            }
        }
    }
    
    executeAttack(attacker, target, attackerPlayer, targetPlayer, game) {
        let damage = attacker.attack;
        
        if (target.type === 'hero') {
            // Атака героя
            targetPlayer.health -= damage;
            
            return {
                damage,
                targetDestroyed: targetPlayer.health <= 0
            };
            
        } else {
            // Атака существа
            // Учитываем щит
            if (target.abilities?.includes('shield')) {
                damage = Math.max(1, damage - 1);
            }
            
            target.currentHealth -= damage;
            
            // Контратака (если не летающий атакует не летающего)
            if (!attacker.abilities?.includes('flying') && 
                !target.abilities?.includes('flying') &&
                target.currentHealth > 0) {
                
                let counterDamage = target.attack;
                if (attacker.abilities?.includes('shield')) {
                    counterDamage = Math.max(1, counterDamage - 1);
                }
                
                attacker.currentHealth -= counterDamage;
            }
            
            // Проверка смерти существ
            const attackerDied = attacker.currentHealth <= 0;
            const targetDied = target.currentHealth <= 0;
            
            if (attackerDied) {
                attackerPlayer.board = attackerPlayer.board.filter(c => c.instanceId !== attacker.instanceId);
            }
            
            if (targetDied) {
                targetPlayer.board = targetPlayer.board.filter(c => c.instanceId !== target.instanceId);
            }
            
            return {
                damage,
                attackerDied,
                targetDestroyed: targetDied
            };
        }
    }
    
    handleAutoAttack(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        if (game.currentTurn !== clientId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const player = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        const opponent = player.id === game.player1.id ? game.player2 : game.player1;
        
        let attacks = [];
        
        player.board.forEach(attacker => {
            if (attacker.canAttack && !attacker.hasAttacked) {
                const target = this.findAutoAttackTarget(attacker, opponent);
                if (target) {
                    const result = this.executeAttack(attacker, target, player, opponent, game);
                    if (result) {
                        attacker.hasAttacked = true;
                        attacker.canAttack = false;
                        
                        attacks.push({
                            attacker: attacker.name,
                            target: target.type === 'hero' ? 'Герой' : target.name,
                            damage: result.damage
                        });
                    }
                }
            }
        });
        
        if (attacks.length > 0) {
            this.addGameLog(game.id, `${player.name}: авто-атака (${attacks.length} ударов)`);
            
            this.sendGameStateToPlayers(game.id);
            this.broadcastGameStateToSpectators(game.id);
            
            this.sendToAllInGame(game.id, {
                type: 'auto_attack',
                attacks: attacks,
                playerName: player.name
            });
            
            // Проверка победы
            if (opponent.health <= 0) {
                this.endGame(game.id, player.id);
            }
        }
    }
    
    findAutoAttackTarget(attacker, opponent) {
        // Приоритеты атаки:
        // 1. Существа с Провокацией
        // 2. Противоположное существо
        // 3. Любое существо
        // 4. Герой
        
        const tauntCreatures = opponent.board.filter(c => c.abilities?.includes('taunt'));
        if (tauntCreatures.length > 0) {
            return tauntCreatures[0];
        }
        
        // Проверка способностей
        if (attacker.abilities?.includes('archer')) {
            // Стрелок атакует героя или летающих
            const flyers = opponent.board.filter(c => c.abilities?.includes('flying'));
            if (flyers.length > 0) {
                return flyers[0];
            }
            return { type: 'hero', health: opponent.health };
        }
        
        if (attacker.abilities?.includes('flying')) {
            // Летающий может атаковать любого
            if (opponent.board.length > 0) {
                return opponent.board[0];
            }
            return { type: 'hero', health: opponent.health };
        }
        
        // Обычная атака
        if (opponent.board.length > 0) {
            return opponent.board[0];
        }
        
        return { type: 'hero', health: opponent.health };
    }
    
    handleEndTurn(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        if (game.currentTurn !== clientId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        this.endTurn(game.id);
    }
    
    endTurn(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        // Меняем ход
        game.currentTurn = game.currentTurn === game.player1.id ? game.player2.id : game.player1.id;
        game.turnNumber++;
        
        // Запускаем следующий ход
        this.startGameTurn(gameId);
    }
    
    handleDrawCard(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        if (game.currentTurn !== clientId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сейчас не ваш ход'
            });
            return;
        }
        
        const player = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        
        // Стоимость взятия карты
        const drawCost = GameConfig.game.drawCardCost + (player.hand.length * GameConfig.game.extraDrawCost);
        const actualCost = Math.ceil(drawCost);
        
        if (player.mana < actualCost) {
            this.sendToClient(clientId, {
                type: 'error',
                message: `Недостаточно маны (нужно ${actualCost})`
            });
            return;
        }
        
        if (player.deck.length === 0) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Колода пуста'
            });
            return;
        }
        
        // Берем карту
        player.mana -= actualCost;
        const card = player.deck.shift();
        card.instanceId = `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        player.hand.push(card);
        
        this.addGameLog(game.id, `${player.name} берет карту (стоимость: ${actualCost})`);
        
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'card_drawn',
            playerName: player.name,
            cost: actualCost
        });
    }
    
    handleSurrender(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        const winnerId = clientId === game.player1.id ? game.player2.id : game.player1.id;
        
        this.endGame(game.id, winnerId, true);
    }
    
    endGame(gameId, winnerId, surrender = false) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        game.status = 'finished';
        
        const winner = winnerId === game.player1.id ? game.player1 : game.player2;
        const loser = winnerId === game.player1.id ? game.player2 : game.player1;
        
        const message = surrender ? 
            `${loser.name} сдался. Победитель: ${winner.name}!` :
            `Победитель: ${winner.name}!`;
        
        this.addGameLog(gameId, message);
        
        // Отправляем результат всем участникам
        this.sendToAllInGame(gameId, {
            type: 'game_ended',
            winner: winner.name,
            winnerId: winner.id,
            message: message,
            gameDuration: Date.now() - game.created
        });
        
        console.log(`🏆 Игра ${gameId} завершена. Победитель: ${winner.name}`);
        
        // Очищаем игру через некоторое время
        setTimeout(() => {
            this.cleanupGame(gameId);
        }, 10000);
    }
    
    cleanupGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        // Сбрасываем статусы игроков
        [game.player1.id, game.player2.id].forEach(playerId => {
            const player = this.clients.get(playerId);
            if (player) {
                player.gameId = null;
                player.status = 'connected';
            }
        });
        
        // Удаляем игру
        this.games.delete(gameId);
        
        console.log(`🧹 Очистка игры ${gameId}`);
        this.broadcastServerInfo();
    }
    
    handleChatMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Очистка сообщения
        message = message.toString().trim().substring(0, 200);
        if (!message) return;
        
        if (client.gameId) {
            // Чат в игре
            this.sendToAllInGame(client.gameId, {
                type: 'chat_message',
                playerId: clientId,
                playerName: client.name,
                message: message,
                timestamp: Date.now()
            });
        } else {
            // Глобальный чат
            this.broadcast({
                type: 'chat_message',
                playerId: clientId,
                playerName: client.name,
                message: message,
                timestamp: Date.now()
            });
        }
    }
    
    handleJoinSpectator(clientId, gameId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        const game = this.games.get(gameId);
        if (!game) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Игра не найдена'
            });
            return;
        }
        
        if (game.spectators.length >= GameConfig.game.maxSpectators) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Достигнут максимум наблюдателей'
            });
            return;
        }
        
        if (!game.spectators.includes(clientId)) {
            game.spectators.push(clientId);
        }
        
        client.type = 'spectator';
        client.gameId = gameId;
        
        console.log(`👁️ ${client.name} наблюдает за игрой ${gameId}`);
        
        this.sendToClient(clientId, {
            type: 'spectator_joined',
            game: this.getGameStateForSpectator(game),
            gameId: gameId
        });
        
        this.broadcastServerInfo();
    }
    
    handleDebugState(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        console.log(`🐞 Debug state для ${clientId}`);
        
        if (client.gameId) {
            const game = this.games.get(client.gameId);
            if (game) {
                console.log(`   Игра: ${game.id}, статус: ${game.status}`);
                this.sendGameStateToPlayers(game.id);
            }
        }
        
        // Отправляем текущее состояние сервера
        this.sendToClient(clientId, {
            type: 'debug_response',
            clientId: client.id,
            gameId: client.gameId,
            status: client.status,
            serverInfo: {
                clients: this.clients.size,
                games: this.games.size,
                queued: this.queuedPlayers.length
            }
        });
    }
    
    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        console.log(`🔌 Отключение: ${clientId} (${client.name || 'unnamed'})`);
        
        // Очищаем heartbeat
        if (client.heartbeatInterval) {
            clearInterval(client.heartbeatInterval);
        }
        
        // Удаляем из очереди
        this.handleLeaveQueue(clientId);
        
        // Обработка отключения из игры
        if (client.gameId) {
            const game = this.games.get(client.gameId);
            if (game) {
                // Если игрок отключился во время игры
                if (client.type === 'player' && game.status === 'active') {
                    const opponentId = clientId === game.player1.id ? game.player2.id : game.player1.id;
                    this.endGame(game.id, opponentId, true);
                }
                
                // Удаляем из наблюдателей
                game.spectators = game.spectators.filter(id => id !== clientId);
            }
        }
        
        // Удаляем клиента
        this.clients.delete(clientId);
        this.broadcastServerInfo();
    }
    
    sendGameStateToPlayers(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const gameState = this.getGameStateForPlayers(game);
        
        [game.player1.id, game.player2.id].forEach(playerId => {
            const client = this.clients.get(playerId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                this.sendToClient(playerId, {
                    type: 'game_state',
                    state: gameState,
                    isPlayer1: playerId === game.player1.id,
                    gameId: gameId,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    broadcastGameStateToSpectators(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const gameState = this.getGameStateForSpectator(game);
        
        game.spectators.forEach(spectatorId => {
            this.sendToClient(spectatorId, {
                type: 'game_state',
                state: gameState,
                isSpectator: true,
                gameId: gameId
            });
        });
    }
    
    getGameStateForPlayers(game) {
        // Для игрока 1
        const player1Hand = game.player1.hand.map(card => ({
            ...card,
            owner: game.player1.id
        }));
        
        // Для игрока 2
        const player2Hand = game.player2.hand.map(card => ({
            ...card,
            owner: game.player2.id
        }));
        
        return {
            id: game.id,
            player1: {
                id: game.player1.id,
                name: game.player1.name,
                health: game.player1.health,
                mana: game.player1.mana,
                maxMana: game.player1.maxMana,
                hand: player1Hand,
                board: game.player1.board,
                deckSize: game.player1.deck.length,
                cardsPlayed: game.player1.cardsPlayed
            },
            player2: {
                id: game.player2.id,
                name: game.player2.name,
                health: game.player2.health,
                mana: game.player2.mana,
                maxMana: game.player2.maxMana,
                hand: player2Hand,
                board: game.player2.board,
                deckSize: game.player2.deck.length,
                cardsPlayed: game.player2.cardsPlayed
            },
            currentTurn: game.currentTurn,
            turnNumber: game.turnNumber,
            turnEndTime: game.turnEndTime,
            status: game.status,
            spectators: game.spectators.length,
            log: game.log.slice(-10)
        };
    }
    
    getGameStateForSpectator(game) {
        return {
            id: game.id,
            player1: {
                name: game.player1.name,
                health: game.player1.health,
                mana: game.player1.mana,
                maxMana: game.player1.maxMana,
                handSize: game.player1.hand.length,
                board: game.player1.board,
                deckSize: game.player1.deck.length
            },
            player2: {
                name: game.player2.name,
                health: game.player2.health,
                mana: game.player2.mana,
                maxMana: game.player2.maxMana,
                handSize: game.player2.hand.length,
                board: game.player2.board,
                deckSize: game.player2.deck.length
            },
            currentTurn: game.currentTurn,
            turnNumber: game.turnNumber,
            turnEndTime: game.turnEndTime,
            status: game.status,
            log: game.log.slice(-10)
        };
    }
    
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`❌ Ошибка отправки клиенту ${clientId}:`, error);
            }
        }
    }
    
    sendToAllInGame(gameId, message) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const recipients = [
            game.player1.id,
            game.player2.id,
            ...game.spectators
        ];
        
        recipients.forEach(clientId => {
            this.sendToClient(clientId, message);
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client, clientId) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(data);
                } catch (error) {
                    console.error(`❌ Ошибка broadcast клиенту ${clientId}:`, error);
                }
            }
        });
    }
    
    broadcastServerInfo() {
        const info = {
            type: 'server_info',
            online: this.clients.size,
            games: this.games.size,
            queued: this.queuedPlayers.length,
            spectators: Array.from(this.clients.values()).filter(c => c.type === 'spectator' && c.gameId).length
        };
        
        this.broadcast(info);
    }
    
    addGameLog(gameId, message) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const entry = {
            time: Date.now(),
            message: message
        };
        
        game.log.push(entry);
        
        // Ограничиваем размер лога
        if (game.log.length > 100) {
            game.log = game.log.slice(-100);
        }
    }
    
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupInactiveClients();
            this.cleanupEmptyGames();
        }, 60000); // Каждую минуту
    }
    
    cleanupInactiveClients() {
        const now = Date.now();
        const inactiveTime = GameConfig.server.inactiveTimeout;
        
        this.clients.forEach((client, clientId) => {
            if (now - client.lastActivity > inactiveTime) {
                console.log(`🧹 Очистка неактивного клиента: ${clientId}`);
                client.ws.close();
            }
        });
    }
    
    cleanupEmptyGames() {
        this.games.forEach((game, gameId) => {
            if (game.status === 'finished') {
                // Проверяем, не старые ли завершенные игры
                if (Date.now() - game.created > 300000) { // 5 минут
                    this.cleanupGame(gameId);
                }
            }
        });
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    logServerInfo() {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 BattleScript Server запущен!');
        console.log('='.repeat(50));
        console.log(`📡 Порт: ${this.port}`);
        console.log(`🌐 HTTP: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket: ws://localhost:${this.port}`);
        console.log('');
        console.log('📊 Конфигурация:');
        console.log(`   • Карт: ${GameConfig.cards.length}`);
        console.log(`   • Макс игроков: ${GameConfig.game.maxPlayers}`);
        console.log(`   • Наблюдателей: ${GameConfig.game.maxSpectators}`);
        console.log(`   • Длительность хода: ${GameConfig.game.turnDuration} сек`);
        console.log('');
        console.log('👥 Ожидание подключений...');
        console.log('='.repeat(50) + '\n');
    }
}

// Запуск сервера
if (require.main === module) {
    const server = new BattleScriptServer();
    
    // Обработка сигналов завершения
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Получен сигнал завершения...');
        server.broadcast({
            type: 'server_shutdown',
            message: 'Сервер завершает работу'
        });
        setTimeout(() => {
            console.log('👋 Сервер остановлен');
            process.exit(0);
        }, 1000);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n🛑 Получен сигнал завершения...');
        server.broadcast({
            type: 'server_shutdown',
            message: 'Сервер завершает работу'
        });
        setTimeout(() => {
            console.log('👋 Сервер остановлен');
            process.exit(0);
        }, 1000);
    });
}

module.exports = BattleScriptServer;