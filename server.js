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
        
        console.log(`\n🎮 BattleScript Server v3.0`);
        console.log(`📊 Конфиг загружен: ${GameConfig.creatureCards.length} существ, ${GameConfig.spellCards.length} заклинаний, ${GameConfig.artifactCards.length} артефактов`);
        console.log(`⚙️  Режим: 1 на 1 с аватарами и артефактами`);
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
            avatar: null,
            status: 'connected',
            type: 'spectator',
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
                avatars: GameConfig.avatars,
                cards: GameConfig.creatureCards.length + GameConfig.spellCards.length,
                artifacts: GameConfig.artifactCards.length
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
                this.handleSetName(clientId, data.name, data.avatar);
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
                this.handlePlayCard(clientId, data.cardId, data.cell);
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
                
            case 'use_artifact':
                this.handleUseArtifact(clientId, data.artifactId, data.targetId);
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
                
            case 'debug_state':
                this.handleDebugState(clientId);
                break;
                
            default:
                console.warn(`⚠️ Неизвестный тип сообщения от ${clientId}:`, data.type);
        }
    }
    
    handleSetName(clientId, name, avatar) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Очищаем и обрезаем имя
        name = name.toString().trim().substring(0, 20);
        if (!name) name = `Игрок_${Math.floor(Math.random() * 1000)}`;
        
        // Проверяем аватар
        avatar = avatar || 'warrior';
        const avatarData = GameConfig.getAvatarById(avatar);
        if (!avatarData) avatar = 'warrior';
        
        client.name = name;
        client.avatar = avatar;
        client.type = 'player';
        
        console.log(`👤 ${clientId} установил имя: ${name}, аватар: ${avatar}`);
        
        this.sendToClient(clientId, {
            type: 'name_set',
            name: client.name,
            avatar: client.avatar,
            clientId: client.id
        });
        
        this.broadcastServerInfo();
    }
    
    handleJoinQueue(clientId) {
        const client = this.clients.get(clientId);
        if (!client || !client.name || !client.avatar) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Сначала выберите имя и аватар'
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
        
        // Создаем колоду артефактов
        const artifactDeck = GameConfig.createArtifactDeck(player1.avatar, player2.avatar);
        
        // Создаем начальные квесты для игроков
        const player1Quest = GameConfig.getRandomQuest();
        const player2Quest = GameConfig.getRandomQuest();
        
        // Получаем данные аватаров
        const avatar1 = GameConfig.getAvatarById(player1.avatar);
        const avatar2 = GameConfig.getAvatarById(player2.avatar);
        
        const game = {
            id: gameId,
            player1: {
                id: player1.id,
                name: player1.name,
                avatar: player1.avatar,
                avatarData: avatar1,
                health: GameConfig.game.startingHealth + (avatar1?.bonusHealth || 0),
                mana: GameConfig.game.startingMana + (avatar1?.bonusMana || 0),
                maxMana: GameConfig.game.startingMana + (avatar1?.bonusMana || 0),
                hand: [],
                board: Array(5).fill(null), // 5 ячеек на поле
                deck: player1Deck,
                artifacts: [], // Полученные артефакты
                quest: player1Quest,
                cardsPlayed: 0,
                creaturesSummoned: 0,
                damageDealt: 0,
                creaturesKilled: 0,
                spellsPlayed: 0,
                healingDone: 0
            },
            player2: {
                id: player2.id,
                name: player2.name,
                avatar: player2.avatar,
                avatarData: avatar2,
                health: GameConfig.game.startingHealth + (avatar2?.bonusHealth || 0),
                mana: GameConfig.game.startingMana + (avatar2?.bonusMana || 0),
                maxMana: GameConfig.game.startingMana + (avatar2?.bonusMana || 0),
                hand: [],
                board: Array(5).fill(null), // 5 ячеек на поле
                deck: player2Deck,
                artifacts: [],
                quest: player2Quest,
                cardsPlayed: 0,
                creaturesSummoned: 0,
                damageDealt: 0,
                creaturesKilled: 0,
                spellsPlayed: 0,
                healingDone: 0
            },
            artifactDeck: artifactDeck,
            artifactDiscard: [],
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
        
        console.log(`🎮 Создана игра ${gameId}: ${player1.name} (${player1.avatar}) vs ${player2.name} (${player2.avatar})`);
        console.log(`📦 Колода артефактов: ${artifactDeck.length} карт`);
        
        // Отправляем состояние игры игрокам
        this.sendGameStateToPlayers(gameId);
        
        // Отправляем сообщение о начале игры
        [player1.id, player2.id].forEach(playerId => {
            this.sendToClient(playerId, {
                type: 'game_started',
                gameId: gameId,
                gameState: this.getGameStateForPlayers(game, playerId),
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
        const opponent = currentPlayer.id === game.player1.id ? game.player2 : game.player1;
        
        // Восстанавливаем ману
        currentPlayer.mana = currentPlayer.maxMana;
        currentPlayer.maxMana = Math.min(currentPlayer.maxMana + 1, GameConfig.game.maxMana);
        
        // Добавляем карту в руку в начале хода
        if (currentPlayer.deck.length > 0 && currentPlayer.hand.length < GameConfig.game.maxHandSize) {
            const newCard = currentPlayer.deck.shift();
            newCard.instanceId = `${newCard.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            currentPlayer.hand.push(newCard);
            
            this.addGameLog(gameId, `${currentPlayer.name} получает карту`);
        }
        
        // Разрешаем атаку существам (кроме тех, что в ячейке 5 со скрытностью)
        currentPlayer.board.forEach((creature, index) => {
            if (creature) {
                creature.canAttack = true;
                creature.hasAttacked = false;
                
                // Существа в ячейке 1 могут атаковать сразу
                if (index === 0) {
                    creature.charge = true;
                }
                
                // Существа в ячейке 5 получают скрытность
                if (index === 4 && !creature.stealthUsed) {
                    creature.stealth = true;
                    creature.stealthUsed = true;
                }
            }
        });
        
        // Сбрасываем статистику за ход
        currentPlayer.creaturesSummoned = 0;
        currentPlayer.damageDealt = 0;
        currentPlayer.creaturesKilled = 0;
        currentPlayer.spellsPlayed = 0;
        currentPlayer.healingDone = 0;
        
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
    
    handlePlayCard(clientId, cardId, cell) {
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
        
        // Проверяем ячейку для существ
        if (card.type === 'creature') {
            if (cell === undefined || cell < 0 || cell > 4) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Выберите ячейку для существа (1-5)'
                });
                return;
            }
            
            if (player.board[cell]) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Ячейка уже занята'
                });
                return;
            }
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
                canAttack: cell === 0, // В ячейке 1 может атаковать сразу
                hasAttacked: false,
                owner: clientId,
                cell: cell,
                stealth: cell === 4, // В ячейке 5 получает скрытность
                stealthUsed: cell === 4,
                artifacts: [], // Артефакты на существе
                bonuses: {
                    attack: 0,
                    health: 0,
                    abilities: []
                }
            };
            
            player.board[cell] = creature;
            player.creaturesSummoned++;
            
            this.addGameLog(game.id, `${player.name} призывает ${card.name} в ячейку ${cell + 1}`);
            
            // Обновляем квест
            player.quest = GameConfig.checkQuestProgress(player.quest, 'summon', 1);
            
        } else if (card.type === 'spell') {
            // Обработка заклинания
            player.spellsPlayed++;
            this.handleSpell(card, player, game, cell);
            
            // Обновляем квест
            player.quest = GameConfig.checkQuestProgress(player.quest, 'spell', 1);
        }
        
        // Проверяем выполнение квеста
        this.checkQuestCompletion(game.id, player.id);
        
        // Обновляем состояние
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'card_played',
            playerId: clientId,
            playerName: player.name,
            card: card,
            cell: cell
        });
        
        this.playSound(clientId, 'cardPlay');
    }
    
    handleSpell(spell, caster, game, targetCell) {
        const opponent = caster.id === game.player1.id ? game.player2 : game.player1;
        
        switch (spell.effect) {
            case 'damage':
                if (targetCell === 'hero') {
                    // Урон герою
                    opponent.health -= spell.value;
                    caster.damageDealt += spell.value;
                    this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на героя (урон: ${spell.value})`);
                } else if (targetCell >= 0 && targetCell <= 4) {
                    // Урон существу
                    const target = opponent.board[targetCell];
                    if (target && !target.bonuses?.abilities?.includes('immune_spells')) {
                        target.currentHealth -= spell.value;
                        caster.damageDealt += spell.value;
                        
                        if (target.currentHealth <= 0) {
                            opponent.board[targetCell] = null;
                            caster.creaturesKilled++;
                            this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на ${target.name} (уничтожено)`);
                        } else {
                            this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на ${target.name} (урон: ${spell.value})`);
                        }
                    }
                }
                break;
                
            case 'heal':
                if (targetCell === 'hero') {
                    // Лечение героя
                    const maxHealth = GameConfig.game.startingHealth + (caster.avatarData?.bonusHealth || 0);
                    caster.health = Math.min(caster.health + spell.value, maxHealth);
                    caster.healingDone += spell.value;
                    this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на героя (исцеление: ${spell.value})`);
                } else if (targetCell >= 0 && targetCell <= 4) {
                    // Лечение существа
                    const target = caster.board[targetCell];
                    if (target) {
                        const healAmount = Math.min(spell.value, target.maxHealth - target.currentHealth);
                        target.currentHealth += healAmount;
                        caster.healingDone += healAmount;
                        this.addGameLog(game.id, `${caster.name} применяет ${spell.name} на ${target.name} (исцеление: ${healAmount})`);
                    }
                }
                break;
                
            case 'damage_all':
                // Урон всем существам противника
                opponent.board.forEach((creature, index) => {
                    if (creature) {
                        creature.currentHealth -= spell.value;
                        caster.damageDealt += spell.value;
                        
                        if (creature.currentHealth <= 0) {
                            opponent.board[index] = null;
                            caster.creaturesKilled++;
                        }
                    }
                });
                this.addGameLog(game.id, `${caster.name} применяет ${spell.name} (урон всем: ${spell.value})`);
                break;
                
            case 'freeze_all':
                // Заморозка всех существ противника
                opponent.board.forEach((creature) => {
                    if (creature) {
                        creature.canAttack = false;
                        creature.frozen = true;
                    }
                });
                this.addGameLog(game.id, `${caster.name} применяет ${spell.name} (все существа заморожены)`);
                break;
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
        
        // Находим атакующего
        let attacker = null;
        let attackerCell = -1;
        
        for (let i = 0; i < player.board.length; i++) {
            const creature = player.board[i];
            if (creature && creature.instanceId === attackerId) {
                attacker = creature;
                attackerCell = i;
                break;
            }
        }
        
        if (!attacker || !attacker.canAttack || attacker.hasAttacked) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Это существо не может атаковать'
            });
            return;
        }
        
        // Проверка на скрытность цели
        if (targetId !== 'hero') {
            const targetCell = parseInt(targetId);
            const target = opponent.board[targetCell];
            
            if (target && target.stealth && !target.hasAttacked) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Нельзя атаковать скрытое существо'
                });
                return;
            }
        }
        
        // Выполнение атаки
        const result = this.executeAttack(attacker, targetId, player, opponent, game, attackerCell);
        
        if (result.success) {
            attacker.hasAttacked = true;
            attacker.canAttack = false;
            attacker.stealth = false; // Снимаем скрытность после атаки
            
            player.damageDealt += result.damageDealt || 0;
            if (result.creatureKilled) {
                player.creaturesKilled++;
            }
            
            this.addGameLog(game.id, 
                `${player.name}: ${attacker.name} атакует ${result.targetName}`
            );
            
            // Обновляем состояние
            this.sendGameStateToPlayers(game.id);
            this.broadcastGameStateToSpectators(game.id);
            
            this.sendToAllInGame(game.id, {
                type: 'attack_executed',
                attacker: attacker.name,
                target: result.targetName,
                damage: result.damageDealt || 0,
                killed: result.creatureKilled || false
            });
            
            // Обновляем квест по урону
            player.quest = GameConfig.checkQuestProgress(player.quest, 'damage', result.damageDealt || 0);
            
            // Проверяем выполнение квеста
            this.checkQuestCompletion(game.id, player.id);
            
            // Проверка победы
            if (opponent.health <= 0) {
                this.endGame(game.id, player.id);
            }
        }
    }
    
    executeAttack(attacker, targetId, attackerPlayer, targetPlayer, game, attackerCell) {
        let target = null;
        let targetCell = -1;
        let targetName = '';
        
        if (targetId === 'hero') {
            // Атака героя
            targetName = 'героя';
            
            // Проверяем существ с провокацией
            const tauntCreatures = targetPlayer.board.filter(c => c && c.abilities?.includes('taunt'));
            if (tauntCreatures.length > 0) {
                // Находим первую провокацию
                for (let i = 0; i < targetPlayer.board.length; i++) {
                    if (targetPlayer.board[i] && targetPlayer.board[i].abilities?.includes('taunt')) {
                        target = targetPlayer.board[i];
                        targetCell = i;
                        targetName = target.name;
                        break;
                    }
                }
            } else {
                // Можно атаковать героя
                const attackPower = attacker.attack + (attacker.bonuses?.attack || 0);
                targetPlayer.health -= attackPower;
                
                return {
                    success: true,
                    damageDealt: attackPower,
                    targetName: 'героя'
                };
            }
        } else {
            // Атака существа
            targetCell = parseInt(targetId);
            target = targetPlayer.board[targetCell];
            if (!target) {
                return { success: false, error: 'Цель не найдена' };
            }
            targetName = target.name;
        }
        
        // Вычисляем урон
        const attackPower = attacker.attack + (attacker.bonuses?.attack || 0);
        const targetHealth = target.currentHealth + (target.bonuses?.health || 0);
        
        // Учитываем броню и способности
        let actualDamage = attackPower;
        if (target.bonuses?.abilities?.includes('armor')) {
            actualDamage = Math.max(1, actualDamage - 3); // Пример брони
        }
        
        target.currentHealth -= actualDamage;
        
        // Контратака (если цель выжила и не заморожена)
        let counterDamage = 0;
        let counterDealt = 0;
        
        if (target.currentHealth > 0 && !target.frozen) {
            counterDamage = target.attack + (target.bonuses?.attack || 0);
            let actualCounterDamage = counterDamage;
            
            if (attacker.bonuses?.abilities?.includes('armor')) {
                actualCounterDamage = Math.max(1, actualCounterDamage - 3);
            }
            
            attacker.currentHealth -= actualCounterDamage;
            counterDealt = actualCounterDamage;
        }
        
        // Проверка смерти существ
        const attackerDied = attacker.currentHealth <= 0;
        const targetDied = target.currentHealth <= 0;
        
        if (attackerDied) {
            attackerPlayer.board[attackerCell] = null;
        }
        
        if (targetDied) {
            targetPlayer.board[targetCell] = null;
        }
        
        return {
            success: true,
            damageDealt: actualDamage,
            counterDamage: counterDealt,
            creatureKilled: targetDied,
            attackerDied: attackerDied,
            targetName: targetName
        };
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
        let totalDamage = 0;
        let creaturesKilled = 0;
        
        player.board.forEach((attacker, cellIndex) => {
            if (attacker && attacker.canAttack && !attacker.hasAttacked) {
                const target = this.findAutoAttackTarget(attacker, opponent);
                if (target) {
                    const result = this.executeAttack(attacker, target.type === 'hero' ? 'hero' : target.cell.toString(), 
                                                    player, opponent, game, cellIndex);
                    if (result.success) {
                        attacker.hasAttacked = true;
                        attacker.canAttack = false;
                        attacker.stealth = false;
                        
                        totalDamage += result.damageDealt || 0;
                        if (result.creatureKilled) creaturesKilled++;
                        
                        attacks.push({
                            attacker: attacker.name,
                            target: target.type === 'hero' ? 'Герой' : target.name,
                            damage: result.damageDealt || 0
                        });
                    }
                }
            }
        });
        
        if (attacks.length > 0) {
            player.damageDealt += totalDamage;
            player.creaturesKilled += creaturesKilled;
            
            this.addGameLog(game.id, `${player.name}: авто-атака (${attacks.length} ударов)`);
            
            // Обновляем квест
            player.quest = GameConfig.checkQuestProgress(player.quest, 'damage', totalDamage);
            player.quest = GameConfig.checkQuestProgress(player.quest, 'kill', creaturesKilled);
            
            // Проверяем выполнение квеста
            this.checkQuestCompletion(game.id, player.id);
            
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
        // 1. Существа с Провокацией (не скрытые)
        // 2. Другие существа (не скрытые)
        // 3. Герой
        
        // Ищем существа с провокацией
        for (let i = 0; i < opponent.board.length; i++) {
            const creature = opponent.board[i];
            if (creature && creature.abilities?.includes('taunt') && 
                (!creature.stealth || creature.hasAttacked)) {
                return { ...creature, cell: i, type: 'creature' };
            }
        }
        
        // Ищем любые не скрытые существа
        for (let i = 0; i < opponent.board.length; i++) {
            const creature = opponent.board[i];
            if (creature && (!creature.stealth || creature.hasAttacked)) {
                return { ...creature, cell: i, type: 'creature' };
            }
        }
        
        // Если нет доступных целей, атакуем героя
        return { type: 'hero', name: 'Герой' };
    }
    
    handleUseArtifact(clientId, artifactId, targetId) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;
        
        const game = this.games.get(client.gameId);
        if (!game) return;
        
        const player = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        
        // Находим артефакт
        const artifactIndex = player.artifacts.findIndex(art => art.instanceId === artifactId);
        if (artifactIndex === -1) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Артефакт не найден'
            });
            return;
        }
        
        const artifact = player.artifacts[artifactIndex];
        
        // Проверяем цель
        let target = null;
        if (targetId === 'hero') {
            target = { type: 'hero' };
        } else {
            const targetCell = parseInt(targetId);
            if (targetCell >= 0 && targetCell <= 4) {
                target = player.board[targetCell];
            }
        }
        
        if (!target) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Цель не найдена'
            });
            return;
        }
        
        // Проверяем требования артефакта
        if (target.type === 'hero' && artifact.requirements && artifact.requirements.length > 0) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Этот артефакт нельзя использовать на героя'
            });
            return;
        }
        
        if (target.type === 'creature') {
            // Проверяем теги существа
            const meetsRequirements = artifact.requirements.every(req => {
                return target.tags?.includes(req);
            });
            
            if (!meetsRequirements) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Существо не соответствует требованиям артефакта'
                });
                return;
            }
        }
        
        // Применяем эффект артефакта
        this.applyArtifactEffect(artifact, target, player, targetId);
        
        // Удаляем артефакт из инвентаря
        player.artifacts.splice(artifactIndex, 1);
        
        this.addGameLog(game.id, `${player.name} использует ${artifact.name} на ${target.type === 'hero' ? 'героя' : target.name}`);
        
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'artifact_used',
            playerName: player.name,
            artifact: artifact.name,
            target: target.type === 'hero' ? 'Герой' : target.name
        });
    }
    
    applyArtifactEffect(artifact, target, player, targetId) {
        switch (artifact.effect) {
            case 'attack_buff':
                if (target.type === 'creature') {
                    target.bonuses = target.bonuses || {};
                    target.bonuses.attack = (target.bonuses.attack || 0) + artifact.value;
                }
                break;
                
            case 'health_buff':
                if (target.type === 'creature') {
                    target.bonuses = target.bonuses || {};
                    target.bonuses.health = (target.bonuses.health || 0) + artifact.value;
                    target.currentHealth += artifact.value;
                    target.maxHealth += artifact.value;
                } else if (target.type === 'hero') {
                    const maxHealth = GameConfig.game.startingHealth + (player.avatarData?.bonusHealth || 0);
                    player.health = Math.min(player.health + artifact.value, maxHealth);
                }
                break;
                
            case 'spell_power':
                // Увеличивает силу будущих заклинаний
                player.spellPower = (player.spellPower || 0) + artifact.value;
                break;
                
            case 'ranged':
                if (target.type === 'creature') {
                    target.bonuses = target.bonuses || {};
                    target.bonuses.abilities = [...(target.bonuses.abilities || []), 'ranged'];
                }
                break;
                
            case 'armor':
                if (target.type === 'creature') {
                    target.bonuses = target.bonuses || {};
                    target.bonuses.abilities = [...(target.bonuses.abilities || []), 'armor'];
                }
                break;
                
            case 'flying':
                if (target.type === 'creature') {
                    target.bonuses = target.bonuses || {};
                    target.bonuses.abilities = [...(target.bonuses.abilities || []), 'flying'];
                }
                break;
                
            case 'speed':
                if (target.type === 'creature') {
                    target.charge = true;
                    target.canAttack = true;
                }
                break;
        }
        
        // Добавляем артефакт к существу
        if (target.type === 'creature') {
            target.artifacts = [...(target.artifacts || []), artifact];
        }
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
        
        // Обновляем квест по лечению
        const currentPlayer = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        currentPlayer.quest = GameConfig.checkQuestProgress(currentPlayer.quest, 'heal', currentPlayer.healingDone);
        
        // Проверяем выполнение квеста
        this.checkQuestCompletion(gameId, currentPlayer.id);
        
        // Меняем ход
        game.currentTurn = game.currentTurn === game.player1.id ? game.player2.id : game.player1.id;
        game.turnNumber++;
        
        // Запускаем следующий ход
        this.startGameTurn(gameId);
    }
    
    checkQuestCompletion(gameId, playerId) {
        const game = this.games.get(gameId);
        if (!game) return;
        
        const player = playerId === game.player1.id ? game.player1 : game.player2;
        
        if (player.quest.completed && !player.quest.rewardGranted) {
            // Выдаем награду
            const reward = GameConfig.getQuestReward(player.quest);
            if (reward) {
                // Создаем экземпляр артефакта
                const artifactInstance = {
                    ...reward,
                    instanceId: `${reward.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                };
                
                player.artifacts.push(artifactInstance);
                
                this.addGameLog(gameId, `${player.name} получает артефакт: ${reward.name} за выполнение квеста!`);
                
                // Создаем новый квест
                player.quest = GameConfig.getRandomQuest();
                
                // Отправляем обновленное состояние
                this.sendGameStateToPlayers(gameId);
                this.broadcastGameStateToSpectators(gameId);
                
                this.sendToClient(playerId, {
                    type: 'quest_completed',
                    artifact: artifactInstance,
                    newQuest: player.quest
                });
            }
        }
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
        
        [game.player1.id, game.player2.id].forEach(playerId => {
            const client = this.clients.get(playerId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                const gameState = this.getGameStateForPlayers(game, playerId);
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
    
    getGameStateForPlayers(game, playerId) {
        const isPlayer1 = playerId === game.player1.id;
        const player = isPlayer1 ? game.player1 : game.player2;
        const opponent = isPlayer1 ? game.player2 : game.player1;
        
        // Формируем состояние для игрока
        return {
            id: game.id,
            player: {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                health: player.health,
                mana: player.mana,
                maxMana: player.maxMana,
                hand: player.hand.map(card => ({
                    ...card,
                    owner: player.id
                })),
                board: player.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index
                    } : null
                ),
                deckSize: player.deck.length,
                artifacts: player.artifacts,
                quest: player.quest,
                cardsPlayed: player.cardsPlayed
            },
            opponent: {
                id: opponent.id,
                name: opponent.name,
                avatar: opponent.avatar,
                health: opponent.health,
                mana: opponent.mana,
                maxMana: opponent.maxMana,
                handSize: opponent.hand.length,
                board: opponent.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        // Скрываем полную информацию о существах противника
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack,
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack
                    } : null
                ),
                deckSize: opponent.deck.length
            },
            artifactDeckSize: game.artifactDeck.length,
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
                avatar: game.player1.avatar,
                health: game.player1.health,
                mana: game.player1.mana,
                maxMana: game.player1.maxMana,
                handSize: game.player1.hand.length,
                board: game.player1.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack,
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack
                    } : null
                ),
                deckSize: game.player1.deck.length,
                artifacts: game.player1.artifacts.length
            },
            player2: {
                name: game.player2.name,
                avatar: game.player2.avatar,
                health: game.player2.health,
                mana: game.player2.mana,
                maxMana: game.player2.maxMana,
                handSize: game.player2.hand.length,
                board: game.player2.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack,
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack
                    } : null
                ),
                deckSize: game.player2.deck.length,
                artifacts: game.player2.artifacts.length
            },
            artifactDeckSize: game.artifactDeck.length,
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
    
    playSound(clientId, soundName) {
        // В будущем можно добавить звуки
    }
    
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupInactiveClients();
            this.cleanupEmptyGames();
        }, 60000);
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
                if (Date.now() - game.created > 300000) {
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
        console.log('🚀 BattleScript Server v3.0 запущен!');
        console.log('='.repeat(50));
        console.log(`📡 Порт: ${this.port}`);
        console.log(`🌐 HTTP: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket: ws://localhost:${this.port}`);
        console.log('');
        console.log('📊 Конфигурация:');
        console.log(`   • Аватаров: ${GameConfig.avatars.length}`);
        console.log(`   • Существ: ${GameConfig.creatureCards.length}`);
        console.log(`   • Заклинаний: ${GameConfig.spellCards.length}`);
        console.log(`   • Артефактов: ${GameConfig.artifactCards.length}`);
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