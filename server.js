const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;

// Используем конфиг из файла
let GameConfig;
try {
    console.log('📦 Загрузка конфига...');
    
    // Перезагружаем кэш модуля
    delete require.cache[require.resolve('./config.js')];
    GameConfig = require('./config.js');
    
    if (!GameConfig) {
        throw new Error('Конфиг загружен, но пуст');
    }
    
    // Создаем общий массив cards для совместимости
    GameConfig.cards = [...(GameConfig.creatureCards || []), ...(GameConfig.spellCards || [])];
    
    console.log(`✅ Конфиг загружен: ${GameConfig.cards.length} карт`);
    console.log(`   • Существ: ${GameConfig.creatureCards?.length || 0}`);
    console.log(`   • Заклинаний: ${GameConfig.spellCards?.length || 0}`);
    console.log(`   • Артефактов: ${GameConfig.artifactCards?.length || 0}`);
    console.log(`   • Аватаров: ${GameConfig.avatars?.length || 0}`);
    
} catch (error) {
    console.error('❌ Ошибка загрузки конфигурации:', error.message);
    console.error('⚙️ Создаю базовый конфиг...');
    
    // Создаем базовый конфиг на случай ошибки
    GameConfig = {
        cards: [],
        creatureCards: [],
        spellCards: [],
        artifactCards: [],
        avatars: [],
        game: {
            maxSpectators: 20,
            startingHealth: 30,
            startingMana: 1,
            initialHandSize: 3,
            maxHandSize: 10,
            maxMana: 10,
            turnDuration: 120
        },
        server: {
            port: 3000,
            heartbeatInterval: 30000,
            inactiveTimeout: 300000
        },
        // Методы-заглушки
        getAvatarById: function(id) {
            return this.avatars.find(avatar => avatar.id === id) || { 
                image: 'https://i.imgur.com/6V9zLqW.png', 
                bonusHealth: 0,
                name: 'Воин'
            };
        },
        createDeck: function() {
            const basicDeck = [];
            for (let i = 0; i < 30; i++) {
                basicDeck.push({
                    id: `basic_${i}`,
                    name: 'Базовый воин',
                    cost: Math.floor(Math.random() * 5) + 1,
                    type: 'creature',
                    attack: Math.floor(Math.random() * 3) + 1,
                    health: Math.floor(Math.random() * 4) + 1,
                    rarity: 'common',
                    image: 'https://i.imgur.com/6V9zLqW.png'
                });
            }
            return basicDeck;
        },
        createArtifactDeck: function() {
            return [];
        },
        getRandomQuest: function() {
            return { 
                id: 'basic_quest',
                type: 'summon',
                requirement: 3,
                description: 'Призовите 3 существ',
                progress: 0,
                completed: false,
                rewardGranted: false
            };
        },
        getQuestReward: function() {
            return {
                id: 'basic_artifact',
                name: 'Базовый артефакт',
                description: 'Простой артефакт',
                effect: 'attack_buff',
                value: 1
            };
        },
        getRarityColor: function(rarity) {
            return '#6b7280';
        }
    };
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
    
    async handleHttpRequest(req, res) {
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
            avatar: 'warrior',
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
                cards: GameConfig.cards.length,
                abilities: Object.keys(GameConfig.abilities || {}).length
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
        
        name = name.toString().trim().substring(0, 20);
        if (!name) name = `Игрок_${Math.floor(Math.random() * 1000)}`;
        
        client.name = name;
        client.avatar = avatar || 'warrior';
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
                mana: GameConfig.game.startingMana,
                maxMana: GameConfig.game.startingMana,
                hand: [],
                board: Array(5).fill(null),
                deck: player1Deck,
                artifacts: [],
                quest: GameConfig.getRandomQuest(),
                cardsPlayed: 0,
                creaturesSummoned: 0,
                damageDealt: 0,
                creaturesKilled: 0,
                spellsPlayed: 0,
                healingDone: 0,
                artifactsUsed: 0,
                damageTaken: 0,
                armor: 0
            },
            player2: {
                id: player2.id,
                name: player2.name,
                avatar: player2.avatar,
                avatarData: avatar2,
                health: GameConfig.game.startingHealth + (avatar2?.bonusHealth || 0),
                mana: GameConfig.game.startingMana,
                maxMana: GameConfig.game.startingMana,
                hand: [],
                board: Array(5).fill(null),
                deck: player2Deck,
                artifacts: [],
                quest: GameConfig.getRandomQuest(),
                cardsPlayed: 0,
                creaturesSummoned: 0,
                damageDealt: 0,
                creaturesKilled: 0,
                spellsPlayed: 0,
                healingDone: 0,
                artifactsUsed: 0,
                damageTaken: 0,
                armor: 0
            },
            artifactDeck: GameConfig.createArtifactDeck(),
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
        
        // НЕМЕДЛЕННО отправляем состояние игры игрокам
        this.sendGameStateToPlayers(gameId);
        
        // Отправляем сообщение о начале игры
        [player1.id, player2.id].forEach(playerId => {
            this.sendToClient(playerId, {
                type: 'game_started',
                gameId: gameId,
                gameState: this.getGameStateForPlayer(game, playerId === player1.id),
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
        if (currentPlayer.deck.length > 0 && currentPlayer.hand.length < GameConfig.game.maxHandSize) {
            const newCard = currentPlayer.deck.shift();
            newCard.instanceId = `${newCard.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            currentPlayer.hand.push(newCard);
            
            this.sendToClient(currentPlayer.id, {
                type: 'card_added',
                card: newCard
            });
        }
        
        // Разрешаем атаку существам
        currentPlayer.board.forEach((creature, index) => {
            if (creature) {
                creature.canAttack = true;
                creature.hasAttacked = false;
                
                // Существа в ячейке 1 могут атаковать сразу
                if (index === 0) {
                    creature.charge = true;
                    creature.canAttack = true;
                }
                
                // Существа в ячейке 5 получают скрытность
                if (index === 4 && !creature.stealthUsed) {
                    creature.stealth = true;
                    creature.stealthUsed = true;
                }
                
                // Снимаем заморозку
                if (creature.frozen) {
                    creature.frozen = false;
                    creature.canAttack = true;
                }
            }
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
                    message: 'Выберите ячейку для существа (0-4)'
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
                canAttack: cell === 0,
                hasAttacked: false,
                owner: clientId,
                cell: cell,
                stealth: cell === 4,
                stealthUsed: cell === 4,
                artifacts: [],
                bonuses: {
                    attack: 0,
                    health: 0,
                    abilities: []
                },
                armor: 0
            };
            
            player.board[cell] = creature;
            player.creaturesSummoned++;
            
            this.addGameLog(game.id, `${player.name} призывает ${card.name} в ячейку ${cell + 1}`);
            
            // Обновляем квест по призыву существ
            if (player.quest && player.quest.type === 'summon') {
                player.quest.progress = (player.quest.progress || 0) + 1;
                if (player.quest.progress >= player.quest.requirement) {
                    player.quest.completed = true;
                }
            }
            
            // Квест по контролю поля
            if (player.quest && player.quest.type === 'board') {
                const boardCount = player.board.filter(c => c).length;
                player.quest.progress = boardCount;
                if (boardCount >= player.quest.requirement) {
                    player.quest.completed = true;
                }
            }
            
        } else if (card.type === 'spell') {
            // Обработка заклинания
            player.spellsPlayed++;
            
            // Применяем эффект заклинания
            const opponent = player.id === game.player1.id ? game.player2 : game.player1;
            
            if (card.effect === 'damage' && cell === 'hero') {
                // Урон герою
                let damage = card.value || 0;
                if (player.avatarData?.spellPower) damage += player.avatarData.spellPower;
                
                if (opponent.armor > 0) {
                    const armorReduction = Math.min(opponent.armor, damage);
                    opponent.armor -= armorReduction;
                    damage -= armorReduction;
                }
                
                opponent.health -= damage;
                player.damageDealt += damage;
                opponent.damageTaken += damage;
                
                this.addGameLog(game.id, `${player.name} применяет ${card.name} на героя (урон: ${damage})`);
                
                if (opponent.health <= 0) {
                    this.endGame(game.id, player.id);
                    return;
                }
            }
            
            // Обновляем квест по заклинаниям
            if (player.quest && player.quest.type === 'spell') {
                player.quest.progress = (player.quest.progress || 0) + 1;
                if (player.quest.progress >= player.quest.requirement) {
                    player.quest.completed = true;
                }
            }
        }
        
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
        
        // Находим атакующее существо
        let attacker = null;
        let attackerCell = null;
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
        
        let target = null;
        let targetCell = null;
        let targetName = '';
        
        if (targetId === 'hero') {
            // Атака героя
            target = 'hero';
            targetName = 'героя';
            
            // Проверяем существо напротив
            const defender = opponent.board[attackerCell];
            if (defender && !defender.stealth) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: `Вы не можете атаковать героя, так как напротив вас находится ${defender.name}`
                });
                return;
            }
            
            // Проверяем существа с провокацией
            const hasTaunt = opponent.board.some(c => c && c.abilities?.includes('taunt'));
            if (hasTaunt) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Сначала нужно атаковать существо с Провокацией'
                });
                return;
            }
        } else {
            // Атака существа
            targetCell = parseInt(targetId);
            target = opponent.board[targetCell];
            
            if (!target) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Цель не найдена'
                });
                return;
            }
            
            // Проверка на скрытность
            if (target.stealth && !target.hasAttacked) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Нельзя атаковать скрытое существо (ячейка 5)'
                });
                return;
            }
            
            targetName = target.name;
        }
        
        // Выполнение атаки
        const attackPower = attacker.attack + (attacker.bonuses?.attack || 0);
        
        if (target === 'hero') {
            // Атака героя
            let damage = attackPower;
            if (opponent.armor > 0) {
                const armorReduction = Math.min(opponent.armor, damage);
                opponent.armor -= armorReduction;
                damage -= armorReduction;
            }
            
            opponent.health -= damage;
            player.damageDealt += damage;
            
            this.addGameLog(game.id, `${player.name}: ${attacker.name} атакует героя (урон: ${damage})`);
            
            if (opponent.health <= 0) {
                this.endGame(game.id, player.id);
                return;
            }
        } else {
            // Атака существа
            let damage = attackPower;
            if (target.armor > 0) {
                const armorReduction = Math.min(target.armor, damage);
                target.armor -= armorReduction;
                damage -= armorReduction;
            }
            
            target.currentHealth -= damage;
            player.damageDealt += damage;
            
            // Контратака (если цель выжила)
            if (target.currentHealth > 0) {
                const counterDamage = target.attack + (target.bonuses?.attack || 0);
                if (attacker.armor > 0) {
                    const armorReduction = Math.min(attacker.armor, counterDamage);
                    attacker.armor -= armorReduction;
                    attacker.currentHealth -= Math.max(0, counterDamage - armorReduction);
                } else {
                    attacker.currentHealth -= counterDamage;
                }
                
                // Проверяем смерть атакующего
                if (attacker.currentHealth <= 0) {
                    player.board[attackerCell] = null;
                    this.addGameLog(game.id, `${attacker.name} погибает в бою`);
                }
            }
            
            // Проверяем смерть цели
            if (target.currentHealth <= 0) {
                opponent.board[targetCell] = null;
                player.creaturesKilled++;
                this.addGameLog(game.id, `${target.name} уничтожено`);
            } else {
                this.addGameLog(game.id, `${attacker.name} атакует ${target.name} (урон: ${damage})`);
            }
        }
        
        // Отмечаем существо как атаковавшее
        attacker.hasAttacked = true;
        attacker.canAttack = false;
        attacker.stealth = false;
        
        // Обновляем квест по урону
        if (player.quest && player.quest.type === 'damage') {
            player.quest.progress = (player.quest.progress || 0) + attackPower;
            if (player.quest.progress >= player.quest.requirement) {
                player.quest.completed = true;
            }
        }
        
        // Обновляем квест по убийствам
        if (player.quest && player.quest.type === 'kill' && target !== 'hero' && target.currentHealth <= 0) {
            player.quest.progress = (player.quest.progress || 0) + 1;
            if (player.quest.progress >= player.quest.requirement) {
                player.quest.completed = true;
            }
        }
        
        // Проверяем выполнение квеста
        this.checkQuestCompletion(game.id, player.id);
        
        // Обновляем состояние
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'attack_executed',
            attacker: attacker.name,
            target: targetName,
            damage: attackPower
        });
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
        
        player.board.forEach((attacker, cell) => {
            if (attacker && attacker.canAttack && !attacker.hasAttacked) {
                // Ищем цель для атаки
                let target = null;
                let targetCell = null;
                
                // 1. Ищем существа с провокацией
                for (let i = 0; i < opponent.board.length; i++) {
                    const creature = opponent.board[i];
                    if (creature && creature.abilities?.includes('taunt') && 
                        (!creature.stealth || creature.hasAttacked)) {
                        target = creature;
                        targetCell = i;
                        break;
                    }
                }
                
                // 2. Проверяем существо напротив
                if (!target) {
                    const defender = opponent.board[cell];
                    if (defender && (!defender.stealth || defender.hasAttacked)) {
                        target = defender;
                        targetCell = cell;
                    }
                }
                
                // 3. Ищем любое не скрытое существо
                if (!target) {
                    for (let i = 0; i < opponent.board.length; i++) {
                        const creature = opponent.board[i];
                        if (creature && (!creature.stealth || creature.hasAttacked)) {
                            target = creature;
                            targetCell = i;
                            break;
                        }
                    }
                }
                
                // 4. Атакуем героя, если нет других целей
                if (!target) {
                    // Проверяем, нет ли защитника напротив
                    const defender = opponent.board[cell];
                    if (!defender || defender.stealth) {
                        // Атакуем героя
                        const attackPower = attacker.attack + (attacker.bonuses?.attack || 0);
                        let damage = attackPower;
                        
                        if (opponent.armor > 0) {
                            const armorReduction = Math.min(opponent.armor, damage);
                            opponent.armor -= armorReduction;
                            damage -= armorReduction;
                        }
                        
                        opponent.health -= damage;
                        totalDamage += damage;
                        player.damageDealt += damage;
                        
                        attacker.hasAttacked = true;
                        attacker.canAttack = false;
                        
                        attacks.push({
                            attacker: attacker.name,
                            target: 'героя',
                            damage: damage
                        });
                        
                        if (opponent.health <= 0) {
                            this.endGame(game.id, player.id);
                            return;
                        }
                    }
                } else if (target) {
                    // Атакуем существо
                    const attackPower = attacker.attack + (attacker.bonuses?.attack || 0);
                    let damage = attackPower;
                    
                    if (target.armor > 0) {
                        const armorReduction = Math.min(target.armor, damage);
                        target.armor -= armorReduction;
                        damage -= armorReduction;
                    }
                    
                    target.currentHealth -= damage;
                    totalDamage += damage;
                    player.damageDealt += damage;
                    
                    // Контратака
                    if (target.currentHealth > 0) {
                        const counterDamage = target.attack + (target.bonuses?.attack || 0);
                        if (attacker.armor > 0) {
                            const armorReduction = Math.min(attacker.armor, counterDamage);
                            attacker.armor -= armorReduction;
                            attacker.currentHealth -= Math.max(0, counterDamage - armorReduction);
                        } else {
                            attacker.currentHealth -= counterDamage;
                        }
                        
                        if (attacker.currentHealth <= 0) {
                            player.board[cell] = null;
                        }
                    }
                    
                    // Проверяем смерть цели
                    if (target.currentHealth <= 0) {
                        opponent.board[targetCell] = null;
                        player.creaturesKilled++;
                    }
                    
                    attacker.hasAttacked = true;
                    attacker.canAttack = false;
                    
                    attacks.push({
                        attacker: attacker.name,
                        target: target.name,
                        damage: damage
                    });
                }
            }
        });
        
        if (attacks.length > 0) {
            // Обновляем квесты
            if (player.quest && player.quest.type === 'damage') {
                player.quest.progress = (player.quest.progress || 0) + totalDamage;
                if (player.quest.progress >= player.quest.requirement) {
                    player.quest.completed = true;
                }
            }
            
            this.checkQuestCompletion(game.id, player.id);
            
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
        } else {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Нет существ для авто-атаки'
            });
        }
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
        
        // Применяем артефакт
        if (artifact.effect === 'attack_buff') {
            // Усиление атаки героя
            player.damageDealt += artifact.value || 0;
        } else if (artifact.effect === 'health_buff') {
            // Усиление здоровья героя
            const maxHealth = GameConfig.game.startingHealth + (player.avatarData?.bonusHealth || 0);
            player.health = Math.min(player.health + (artifact.value || 0), maxHealth);
        }
        
        // Удаляем артефакт из инвентаря
        player.artifacts.splice(artifactIndex, 1);
        player.artifactsUsed++;
        
        this.addGameLog(game.id, `${player.name} использует ${artifact.name}`);
        
        // Обновляем квест по артефактам
        if (player.quest && player.quest.type === 'artifact') {
            player.quest.progress = (player.quest.progress || 0) + 1;
            if (player.quest.progress >= player.quest.requirement) {
                player.quest.completed = true;
            }
        }
        
        this.checkQuestCompletion(game.id, player.id);
        
        this.sendGameStateToPlayers(game.id);
        this.broadcastGameStateToSpectators(game.id);
        
        this.sendToAllInGame(game.id, {
            type: 'artifact_used',
            playerName: player.name,
            artifact: artifact.name
        });
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
        
        const currentPlayer = game.currentTurn === game.player1.id ? game.player1 : game.player2;
        const opponent = currentPlayer.id === game.player1.id ? game.player2 : game.player1;
        
        // Обновляем квест по лечению
        if (currentPlayer.quest && currentPlayer.quest.type === 'heal') {
            currentPlayer.quest.progress = currentPlayer.healingDone || 0;
            if (currentPlayer.quest.progress >= currentPlayer.quest.requirement) {
                currentPlayer.quest.completed = true;
            }
        }
        
        // Обновляем квест по выживанию
        if (opponent.quest && opponent.quest.type === 'survive') {
            opponent.quest.progress = opponent.damageTaken || 0;
            if (opponent.quest.progress >= opponent.quest.requirement) {
                opponent.quest.completed = true;
            }
        }
        
        // Проверяем выполнение квеста
        this.checkQuestCompletion(gameId, currentPlayer.id);
        this.checkQuestCompletion(gameId, opponent.id);
        
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
        
        if (player.quest && player.quest.completed && !player.quest.rewardGranted) {
            // Выдаем награду за квест
            const reward = GameConfig.getQuestReward ? GameConfig.getQuestReward(player.quest) : null;
            if (reward) {
                const artifactInstance = {
                    ...reward,
                    instanceId: `${reward.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                };
                
                player.artifacts.push(artifactInstance);
                player.quest.rewardGranted = true;
                
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
                const isPlayer1 = playerId === game.player1.id;
                this.sendToClient(playerId, {
                    type: 'game_state',
                    state: this.getGameStateForPlayer(game, isPlayer1),
                    isPlayer1: isPlayer1,
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
    
    getGameStateForPlayer(game, isPlayer1) {
        const player = isPlayer1 ? game.player1 : game.player2;
        const opponent = isPlayer1 ? game.player2 : game.player1;
        
        return {
            id: game.id,
            player: {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                avatarData: player.avatarData,
                health: player.health,
                armor: player.armor || 0,
                mana: player.mana,
                maxMana: player.maxMana,
                hand: player.hand.map(card => ({
                    ...card,
                    owner: player.id
                })),
                board: player.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        canAttack: creature.canAttack,
                        hasAttacked: creature.hasAttacked,
                        stealth: creature.stealth,
                        frozen: creature.frozen,
                        charge: creature.charge,
                        artifacts: creature.artifacts || []
                    } : null
                ),
                deckSize: player.deck.length,
                artifacts: player.artifacts,
                quest: player.quest,
                cardsPlayed: player.cardsPlayed,
                spellPower: player.avatarData?.spellPower || 0
            },
            opponent: {
                id: opponent.id,
                name: opponent.name,
                avatar: opponent.avatar,
                avatarData: opponent.avatarData,
                health: opponent.health,
                armor: opponent.armor || 0,
                mana: opponent.mana,
                maxMana: opponent.maxMana,
                handSize: opponent.hand.length,
                board: opponent.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack + (creature.bonuses?.attack || 0),
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack,
                        frozen: creature.frozen,
                        charge: creature.charge,
                        armor: creature.armor || 0
                    } : null
                ),
                deckSize: opponent.deck.length,
                artifactsCount: opponent.artifacts.length
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
                avatar: game.player1.avatar,
                avatarData: game.player1.avatarData,
                health: game.player1.health,
                armor: game.player1.armor || 0,
                mana: game.player1.mana,
                maxMana: game.player1.maxMana,
                handSize: game.player1.hand.length,
                board: game.player1.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack + (creature.bonuses?.attack || 0),
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack,
                        frozen: creature.frozen,
                        charge: creature.charge,
                        armor: creature.armor || 0
                    } : null
                ),
                deckSize: game.player1.deck.length,
                artifactsCount: game.player1.artifacts.length
            },
            player2: {
                name: game.player2.name,
                avatar: game.player2.avatar,
                avatarData: game.player2.avatarData,
                health: game.player2.health,
                armor: game.player2.armor || 0,
                mana: game.player2.mana,
                maxMana: game.player2.maxMana,
                handSize: game.player2.hand.length,
                board: game.player2.board.map((creature, index) => 
                    creature ? {
                        ...creature,
                        cell: index,
                        currentHealth: creature.currentHealth,
                        maxHealth: creature.maxHealth,
                        attack: creature.attack + (creature.bonuses?.attack || 0),
                        name: creature.name,
                        abilities: creature.abilities,
                        stealth: creature.stealth,
                        hasAttacked: creature.hasAttacked,
                        canAttack: creature.canAttack,
                        frozen: creature.frozen,
                        charge: creature.charge,
                        armor: creature.armor || 0
                    } : null
                ),
                deckSize: game.player2.deck.length,
                artifactsCount: game.player2.artifacts.length
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
        console.log('🚀 BattleScript Server запущен!');
        console.log('='.repeat(50));
        console.log(`📡 Порт: ${this.port}`);
        console.log(`🌐 HTTP: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket: ws://localhost:${this.port}`);
        console.log('');
        console.log('📊 Конфигурация:');
        console.log(`   • Карт: ${GameConfig.cards.length}`);
        console.log(`   • Существ: ${GameConfig.creatureCards?.length || 0}`);
        console.log(`   • Заклинаний: ${GameConfig.spellCards?.length || 0}`);
        console.log(`   • Макс игроков: ${GameConfig.game.maxPlayers || 2}`);
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