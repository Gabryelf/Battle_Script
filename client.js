// Клиентская часть BattleScript
class BattleScriptClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.playerName = null;
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        this.selectedCard = null;
        this.turnTimer = null;
        this.timeLeft = 0;
        this.soundEnabled = GameConfig.sounds.enabled;
        this.lastServerInfo = {};
        this.heartbeatInterval = null;
        this.isConnected = false;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.createParticles();
        this.connectToServer();
        this.updateTopCards();
        
        // Обновляем размеры при загрузке
        setTimeout(() => this.handleResize(), 100);
    }
    
    setupEventListeners() {
        // Главный экран
        document.getElementById('enterNameBtn').addEventListener('click', () => this.showNameModal());
        document.getElementById('quickJoinBtn').addEventListener('click', () => this.quickJoin());
        document.getElementById('findOpponentBtn').addEventListener('click', () => this.joinQueue());
        document.getElementById('spectateBtn').addEventListener('click', () => this.showSpectateModal());
        
        // Модальное окно имени
        document.getElementById('confirmNameBtn').addEventListener('click', () => this.confirmName());
        document.getElementById('cancelNameBtn').addEventListener('click', () => this.hideNameModal());
        document.getElementById('closeNameModal').addEventListener('click', () => this.hideNameModal());
        document.getElementById('nameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmName();
        });
        
        // Предустановки имен
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                document.getElementById('nameInput').value = name;
            });
        });
        
        // Игровой экран
        document.getElementById('exitGameBtn').addEventListener('click', () => this.returnToMain());
        document.getElementById('menuBtn').addEventListener('click', () => this.showGameMenu());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        
        // Управление игрой
        document.getElementById('attackBtn').addEventListener('click', () => this.attack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playCard());
        document.getElementById('autoAttackBtn').addEventListener('click', () => this.autoAttack());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
        document.getElementById('drawCardBtn').addEventListener('click', () => this.drawCard());
        
        // Чат
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Меню игры
        document.getElementById('closeMenuModal').addEventListener('click', () => this.hideGameMenu());
        document.getElementById('resumeGameBtn').addEventListener('click', () => this.hideGameMenu());
        document.getElementById('returnToMainBtn').addEventListener('click', () => this.returnToMain());
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => this.handleResize());
        
        // Предотвращение масштабирования на мобильных устройствах
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturestart', (e) => e.preventDefault());
    }
    
    connectToServer() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const port = GameConfig.server.port;
        const wsUrl = `${protocol}//${host}:${port}`;
        
        this.showLoading('Подключение к серверу...');
        
        console.log('🔄 Подключение к серверу:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ WebSocket подключен');
            this.isConnected = true;
            this.updateConnectionStatus(true, wsUrl);
            this.hideLoading();
            this.startHeartbeat();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Получено от сервера:', data.type);
                this.handleServerMessage(data);
            } catch (e) {
                console.error('❌ Ошибка парсинга сообщения:', e, event.data);
            }
        };
        
        this.ws.onclose = (event) => {
            console.log('❌ WebSocket отключен:', event.code, event.reason);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.stopHeartbeat();
            
            if (this.currentGameId && this.isPlayer) {
                this.addGameLog('Потеряно соединение с сервером', 'error');
            }
            
            setTimeout(() => {
                if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                    console.log('🔄 Попытка переподключения...');
                    this.connectToServer();
                }
            }, GameConfig.server.reconnectDelay);
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            this.hideLoading();
            this.showLoading('Ошибка подключения к серверу...');
        };
    }
    
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendToServer({ type: 'ping' });
            }
        }, 30000);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    handleServerMessage(data) {
        switch (data.type) {
            case 'init':
                this.handleInit(data);
                break;
                
            case 'name_set':
                this.handleNameSet(data);
                break;
                
            case 'server_info':
                this.handleServerInfo(data);
                break;
                
            case 'joined_queue':
                this.handleJoinedQueue(data);
                break;
                
            case 'left_queue':
                this.handleLeftQueue();
                break;
                
            case 'game_state':
                this.handleGameState(data);
                break;
                
            case 'game_started':
                this.handleGameStarted(data);
                break;
                
            case 'game_ended':
                this.handleGameEnded(data);
                break;
                
            case 'card_played':
                this.handleCardPlayed(data);
                break;
                
            case 'attack_executed':
                this.handleAttackExecuted(data);
                break;
                
            case 'auto_attack':
                this.handleAutoAttackResult(data);
                break;
                
            case 'card_added':
                this.handleCardAdded(data);
                break;
                
            case 'card_drawn':
                this.handleCardDrawn(data);
                break;
                
            case 'chat_message':
                this.handleChatMessage(data);
                break;
                
            case 'spectator_joined':
                this.handleSpectatorJoined(data);
                break;
                
            case 'turn_changed':
                this.handleTurnChanged(data);
                break;
                
            case 'error':
                this.handleError(data);
                break;
                
            case 'server_shutdown':
                this.handleServerShutdown(data);
                break;
                
            case 'debug_response':
                this.handleDebugResponse(data);
                break;
                
            case 'pong':
                // Просто отвечаем на пинг
                break;
        }
    }
    
    handleInit(data) {
        this.clientId = data.clientId;
        this.updateServerStats(data.serverInfo);
        console.log('🎮 Инициализирован клиент:', this.clientId);
    }
    
    handleNameSet(data) {
        this.playerName = data.name;
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName}`, 'info');
    }
    
    handleServerInfo(data) {
        this.lastServerInfo = data;
        this.updateServerStats(data);
    }
    
    handleJoinedQueue(data) {
        this.showLoading(`В очереди... Позиция: ${data.position}`);
        this.addGameLog(`Вы в очереди на игру (позиция: ${data.position})`, 'info');
    }
    
    handleLeftQueue() {
        this.hideLoading();
        this.addGameLog('Вы покинули очередь', 'info');
    }
    
    handleGameState(data) {
        console.log('🎮 Получено состояние игры:', data.state?.id);
        
        this.gameState = data.state;
        this.currentGameId = this.gameState?.id || data.gameId;
        
        if (data.isSpectator) {
            this.isSpectator = true;
            this.isPlayer = false;
            this.updateSpectatorView();
        } else {
            this.isPlayer = true;
            this.isSpectator = false;
            this.updatePlayerView(data.isPlayer1);
        }
        
        this.updateGameBoard();
        this.updateGameInfo();
        
        if (this.gameState.status === 'active' && this.gameState.turnEndTime) {
            this.startTurnTimer(this.gameState.turnEndTime);
        } else {
            this.stopTurnTimer();
        }
        
        // Обновляем UI
        const isMyTurn = this.isPlayer && 
                        this.gameState.currentTurn === this.getPlayerId() &&
                        this.gameState.status === 'active';
        this.updateControls(isMyTurn);
        
        this.hideLoading();
    }
    
    handleGameStarted(data) {
        console.log('🎮 Игра началась!', data.gameId);
        
        this.currentGameId = data.gameId;
        
        if (data.gameState) {
            this.gameState = data.gameState;
        }
        
        this.showGameScreen();
        this.addGameLog('Игра началась!', 'success');
        this.playSound('cardPlay');
        this.hideLoading();
    }
    
    handleGameEnded(data) {
        console.log('🏆 Игра завершена:', data.message);
        
        this.stopTurnTimer();
        this.isPlayer = false;
        this.isSpectator = false;
        
        this.addGameLog(data.message, data.winnerId === this.clientId ? 'victory' : 'defeat');
        
        if (data.winnerId === this.clientId) {
            this.playSound('victory');
            setTimeout(() => {
                alert(`🎉 Победа! ${data.message}`);
                this.returnToMain();
            }, 2000);
        } else {
            this.playSound('defeat');
            setTimeout(() => {
                alert(`💥 Поражение. ${data.message}`);
                this.returnToMain();
            }, 2000);
        }
    }
    
    handleCardPlayed(data) {
        if (data.playerId !== this.clientId) {
            this.addGameLog(`${data.playerName} разыгрывает ${data.card.name}`, 'info');
            this.playSound('cardPlay');
        }
    }
    
    handleAttackExecuted(data) {
        this.addGameLog(`${data.attacker} атакует ${data.target} (урон: ${data.damage})`, 'attack');
        this.playSound('attack');
    }
    
    handleAutoAttackResult(data) {
        this.addGameLog(`${data.playerName}: авто-атака (${data.attacks.length} ударов)`, 'info');
        if (data.attacks.length > 0) {
            this.playSound('attack');
        }
    }
    
    handleCardAdded(data) {
        this.addGameLog(`Добавлена карта: ${data.card.name}`, 'success');
        this.playSound('draw');
    }
    
    handleCardDrawn(data) {
        if (data.playerName !== this.playerName) {
            this.addGameLog(`${data.playerName} берет карту`, 'info');
        }
    }
    
    handleChatMessage(data) {
        this.addChatMessage(data.playerName, data.message, data.timestamp);
    }
    
    handleSpectatorJoined(data) {
        this.isSpectator = true;
        this.isPlayer = false;
        this.gameState = data.game;
        this.currentGameId = data.gameId;
        
        this.showGameScreen();
        this.updateSpectatorView();
        this.updateGameBoard();
        this.addGameLog('Вы присоединились как наблюдатель', 'info');
        this.hideLoading();
    }
    
    handleTurnChanged(data) {
        if (this.gameState) {
            this.gameState.currentTurn = data.currentTurn;
            this.gameState.turnNumber = data.turnNumber;
            
            this.addGameLog(`Ход ${data.turnNumber}: ${data.playerName}`, 'info');
            this.updateGameBoard();
            this.updateGameInfo();
            
            // Если это наш ход
            if (this.isPlayer && data.currentTurn === this.getPlayerId()) {
                this.playSound('cardPlay');
                this.updateControls(true);
            }
        }
    }
    
    handleError(data) {
        console.error('❌ Ошибка от сервера:', data.message);
        this.addGameLog(`Ошибка: ${data.message}`, 'error');
        this.hideLoading();
    }
    
    handleServerShutdown(data) {
        this.addGameLog(`Сервер завершает работу: ${data.message}`, 'error');
        setTimeout(() => {
            alert('Сервер завершает работу. Игра будет перезагружена.');
            location.reload();
        }, 3000);
    }
    
    handleDebugResponse(data) {
        console.log('🐞 Debug ответ:', data);
    }
    
    sendToServer(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(data));
                console.log('📤 Отправлено серверу:', data.type);
            } catch (error) {
                console.error('❌ Ошибка отправки на сервер:', error);
                this.showLoading('Ошибка отправки данных...');
            }
        } else {
            console.error('❌ WebSocket не подключен');
            this.showLoading('Нет подключения к серверу...');
        }
    }
    
    // UI методы
    showLoading(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = loadingScreen.querySelector('.loading-text');
        
        loadingText.textContent = message;
        loadingScreen.classList.add('active');
    }
    
    hideLoading() {
        document.getElementById('loadingScreen').classList.remove('active');
    }
    
    updateConnectionStatus(connected, url = '') {
        const statusElement = document.getElementById('connectionStatus');
        const addressElement = document.getElementById('serverAddress');
        
        if (connected) {
            statusElement.className = 'connection-status connected';
            statusElement.innerHTML = '<i class="fas fa-wifi"></i><span>Подключено</span>';
            addressElement.textContent = url;
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = '<i class="fas fa-plug"></i><span>Не подключено</span>';
            addressElement.textContent = 'Подключение...';
        }
    }
    
    updateServerStats(info) {
        document.getElementById('onlinePlayers').textContent = info.online || 0;
        document.getElementById('totalCards').textContent = info.cards || 0;
        document.getElementById('activeGames').textContent = info.games || 0;
    }
    
    updatePlayerDisplay() {
        document.getElementById('playerNameDisplay').textContent = this.playerName;
        const playerStatus = document.getElementById('playerStatus');
        playerStatus.className = 'status-badge connected';
        playerStatus.innerHTML = '<i class="fas fa-sign-in-alt"></i> В игре';
    }
    
    showNameModal() {
        document.getElementById('nameModal').classList.add('active');
        document.getElementById('nameInput').focus();
    }
    
    hideNameModal() {
        document.getElementById('nameModal').classList.remove('active');
        document.getElementById('nameInput').value = '';
    }
    
    confirmName() {
        const nameInput = document.getElementById('nameInput');
        const name = nameInput.value.trim();
        
        if (name) {
            this.sendToServer({
                type: 'set_name',
                name: name
            });
        } else {
            alert('Введите имя!');
            nameInput.focus();
        }
    }
    
    quickJoin() {
        if (!this.playerName) {
            this.showNameModal();
            return;
        }
        
        this.joinQueue();
    }
    
    joinQueue() {
        if (!this.playerName) {
            this.showNameModal();
            return;
        }
        
        this.sendToServer({
            type: 'join_queue'
        });
    }
    
    showSpectateModal() {
        // В будущем можно добавить список активных игр
        alert('В текущей версии наблюдатели подключаются автоматически к новым играм');
    }
    
    showGameScreen() {
        console.log('🔄 Переход на экран игры');
        
        document.getElementById('mainScreen').classList.remove('active-screen');
        document.getElementById('gameScreen').classList.add('active-screen');
        
        // Обновляем размеры при переходе
        setTimeout(() => this.handleResize(), 100);
    }
    
    showMainScreen() {
        console.log('🔄 Возврат в главное меню');
        
        document.getElementById('gameScreen').classList.remove('active-screen');
        document.getElementById('mainScreen').classList.add('active-screen');
        
        // Выход из игры
        if (this.currentGameId && this.isPlayer) {
            this.sendToServer({
                type: 'leave_queue'
            });
        }
        
        this.resetGameState();
    }
    
    returnToMain() {
        if (this.currentGameId && this.isPlayer && 
            this.gameState && this.gameState.status === 'active') {
            if (confirm('Вы уверены? Это засчитается как поражение.')) {
                this.sendToServer({
                    type: 'surrender'
                });
                setTimeout(() => {
                    this.showMainScreen();
                }, 1000);
            }
        } else {
            this.showMainScreen();
        }
    }
    
    resetGameState() {
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        this.selectedCard = null;
        this.stopTurnTimer();
        
        // Сбрасываем UI
        document.getElementById('playerHand').innerHTML = '';
        document.getElementById('playerBoard').innerHTML = '';
        document.getElementById('opponentHand').innerHTML = '';
        document.getElementById('opponentBoard').innerHTML = '';
        document.getElementById('gameLog').innerHTML = '';
        document.getElementById('chatMessages').innerHTML = '';
        
        // Сбрасываем статус игрока
        const playerStatus = document.getElementById('playerStatus');
        playerStatus.className = 'status-badge disconnected';
        playerStatus.innerHTML = '<i class="fas fa-sign-out-alt"></i> Не в игре';
    }
    
    updatePlayerView(isPlayer1) {
        if (!this.gameState) return;
        
        const player = isPlayer1 ? this.gameState.player1 : this.gameState.player2;
        const opponent = isPlayer1 ? this.gameState.player2 : this.gameState.player1;
        
        // Обновляем информацию о игроке
        document.getElementById('gamePlayerName').textContent = this.playerName;
        document.getElementById('gameCurrentPlayerName').textContent = this.playerName;
        document.getElementById('playerMana').textContent = player.mana;
        document.getElementById('playerMaxMana').textContent = player.maxMana;
        document.getElementById('playerHealth').textContent = player.health;
        document.getElementById('playerHandCount').textContent = player.hand?.length || 0;
        
        // Обновляем информацию о противнике
        document.getElementById('opponentName').textContent = opponent.name;
        document.getElementById('opponentMana').textContent = opponent.mana;
        document.getElementById('opponentMaxMana').textContent = opponent.maxMana;
        document.getElementById('opponentHealth').textContent = opponent.health;
        document.getElementById('opponentHandCount').textContent = opponent.hand?.length || 0;
        
        // Рендерим руку и поле игрока
        this.renderHand('playerHand', player.hand || [], true);
        this.renderBoard('playerBoard', player.board || [], true);
        
        // Рука противника скрыта
        this.renderHiddenHand('opponentHand', opponent.hand?.length || 0);
        this.renderBoard('opponentBoard', opponent.board || [], false);
        
        // Обновляем статус хода
        const isMyTurn = this.gameState.currentTurn === player.id;
        this.updateTurnIndicator(isMyTurn);
    }
    
    updateSpectatorView() {
        if (!this.gameState) return;
        
        const player1 = this.gameState.player1;
        const player2 = this.gameState.player2;
        
        // Обновляем информацию
        document.getElementById('gamePlayerName').textContent = 'Наблюдатель';
        document.getElementById('gameCurrentPlayerName').textContent = 'Наблюдатель';
        
        // Игрок 1 (снизу)
        document.getElementById('playerName').textContent = player1.name;
        document.getElementById('playerMana').textContent = player1.mana;
        document.getElementById('playerMaxMana').textContent = player1.maxMana;
        document.getElementById('playerHealth').textContent = player1.health;
        document.getElementById('playerHandCount').textContent = player1.handSize || 0;
        
        // Игрок 2 (сверху)
        document.getElementById('opponentName').textContent = player2.name;
        document.getElementById('opponentMana').textContent = player2.mana;
        document.getElementById('opponentMaxMana').textContent = player2.maxMana;
        document.getElementById('opponentHealth').textContent = player2.health;
        document.getElementById('opponentHandCount').textContent = player2.handSize || 0;
        
        // Рендерим обе стороны (руки скрыты)
        this.renderHiddenHand('playerHand', player1.handSize || 0);
        this.renderBoard('playerBoard', player1.board || [], true);
        
        this.renderHiddenHand('opponentHand', player2.handSize || 0);
        this.renderBoard('opponentBoard', player2.board || [], false);
    }
    
    updateGameBoard() {
        if (!this.gameState) return;
        
        // Обновляем информацию о ходе
        const turnIndicator = document.getElementById('turnIndicator');
        const currentPlayer = this.gameState.currentTurn === this.gameState.player1.id ? 
                             this.gameState.player1 : this.gameState.player2;
        
        if (this.gameState.status === 'active') {
            turnIndicator.className = 'turn-indicator active';
            turnIndicator.innerHTML = `<i class="fas fa-hourglass-start"></i><span>Ход: ${currentPlayer.name}</span>`;
        } else {
            turnIndicator.className = 'turn-indicator waiting';
            turnIndicator.innerHTML = `<i class="fas fa-hourglass-half"></i><span>Ожидание...</span>`;
        }
    }
    
    updateGameInfo() {
        if (!this.gameState) return;
        
        // Обновляем номер хода
        document.getElementById('gameTimer').querySelector('span').textContent = 
            this.formatTime(this.timeLeft);
    }
    
    updateTurnIndicator(isMyTurn) {
        if (!this.isPlayer) return;
        
        const indicator = document.getElementById('turnIndicator');
        const statusElement = document.getElementById('playerGameStatus');
        
        if (isMyTurn) {
            indicator.classList.add('your-turn');
            statusElement.textContent = 'Ваш ход';
            statusElement.style.color = '#10b981';
        } else {
            indicator.classList.remove('your-turn');
            statusElement.textContent = 'Ход противника';
            statusElement.style.color = '#ef4444';
        }
    }
    
    updateControls(isMyTurn) {
        const controls = [
            'attackBtn',
            'playCardBtn',
            'autoAttackBtn',
            'endTurnBtn',
            'drawCardBtn'
        ];
        
        const isEnabled = this.isPlayer && isMyTurn && this.gameState?.status === 'active';
        
        controls.forEach(controlId => {
            const control = document.getElementById(controlId);
            if (control) {
                control.disabled = !isEnabled;
                control.style.opacity = isEnabled ? '1' : '0.5';
            }
        });
        
        // Обновляем текст кнопки розыгрыша карты
        const playBtn = document.getElementById('playCardBtn');
        if (this.selectedCard) {
            const shortName = this.selectedCard.name.length > 10 
                ? this.selectedCard.name.substring(0, 10) + '...' 
                : this.selectedCard.name;
            playBtn.innerHTML = `<i class="fas fa-play"></i><span>Играть ${shortName}</span>`;
        } else {
            playBtn.innerHTML = `<i class="fas fa-play"></i><span>Играть карту</span>`;
        }
    }
    
    renderHand(containerId, hand, isOwnHand) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!hand || hand.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-hand';
            emptyMsg.innerHTML = '<i class="fas fa-inbox"></i><span>Рука пуста</span>';
            container.appendChild(emptyMsg);
            return;
        }
        
        hand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, isOwnHand ? 'hand' : 'opponent-hand');
            container.appendChild(cardElement);
            
            if (isOwnHand) {
                // Добавляем обработчик выбора карты
                cardElement.addEventListener('click', () => this.selectCard(card));
            }
        });
    }
    
    renderBoard(containerId, board, isOwnBoard) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!board || board.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-board';
            emptyMsg.innerHTML = '<i class="fas fa-chess-board"></i><span>Поле пусто</span>';
            container.appendChild(emptyMsg);
            return;
        }
        
        board.forEach((creature, index) => {
            const cardElement = this.createCardElement(creature, 'board');
            container.appendChild(cardElement);
            
            if (isOwnBoard && creature.canAttack && !creature.hasAttacked) {
                // Добавляем возможность атаки
                cardElement.classList.add('can-attack');
                cardElement.addEventListener('click', () => this.selectAttacker(creature));
            }
        });
    }
    
    renderHiddenHand(containerId, count) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (count === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-hand';
            emptyMsg.innerHTML = '<i class="fas fa-inbox"></i><span>Рука пуста</span>';
            container.appendChild(emptyMsg);
            return;
        }
        
        for (let i = 0; i < count; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card hidden-card';
            cardElement.innerHTML = `
                <div class="card-back">
                    <i class="fas fa-question"></i>
                </div>
            `;
            container.appendChild(cardElement);
        }
    }
    
    createCardElement(cardData, location) {
        const card = document.createElement('div');
        card.className = `card ${location} rarity-${cardData.rarity}`;
        card.dataset.id = cardData.instanceId;
        
        const rarityColor = GameConfig.getRarityColor(cardData.rarity);
        
        let abilitiesHTML = '';
        if (cardData.abilities && cardData.abilities.length > 0) {
            abilitiesHTML = `
                <div class="card-abilities">
                    ${cardData.abilities.map(abilityId => {
                        const abilityName = GameConfig.getAbilityName(abilityId);
                        return `<span class="ability-badge">${abilityName}</span>`;
                    }).join('')}
                </div>
            `;
        }
        
        let statsHTML = '';
        if (cardData.type === 'creature') {
            const health = cardData.currentHealth || cardData.health;
            const maxHealth = cardData.maxHealth || cardData.health;
            
            statsHTML = `
                <div class="card-stats">
                    <div class="stat attack">
                        <i class="fas fa-bolt"></i>
                        <span>${cardData.attack}</span>
                    </div>
                    <div class="stat health">
                        <i class="fas fa-heart"></i>
                        <span>${health}/${maxHealth}</span>
                    </div>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="card-header" style="border-color: ${rarityColor}">
                <div class="card-cost" style="background: ${rarityColor}">
                    ${cardData.cost}
                </div>
                <div class="card-name">${cardData.name}</div>
            </div>
            <div class="card-image">
                ${cardData.image || '<i class="fas fa-card"></i>'}
            </div>
            ${statsHTML}
            ${abilitiesHTML}
            <div class="card-description">
                ${cardData.description || ''}
            </div>
        `;
        
        return card;
    }
    
    selectCard(card) {
        if (!this.isPlayer || !this.gameState) return;
        
        const player = this.getPlayer();
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        // Снимаем выделение со всех карт
        document.querySelectorAll('.card.selected').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Выделяем выбранную карту
        const cardElement = document.querySelector(`[data-id="${card.instanceId}"]`);
        if (cardElement) {
            cardElement.classList.add('selected');
        }
        
        this.selectedCard = card;
        this.updateControls(this.isPlayer && this.gameState.currentTurn === this.getPlayerId());
    }
    
    selectAttacker(creature) {
        if (!this.isPlayer || !this.gameState) return;
        
        const player = this.getPlayer();
        if (this.gameState.currentTurn !== player.id) return;
        
        if (!creature.canAttack || creature.hasAttacked) {
            this.addGameLog('Это существо не может атаковать', 'error');
            return;
        }
        
        // Показываем цели для атаки
        this.showAttackTargets(creature);
    }
    
    showAttackTargets(attacker) {
        const opponent = this.getOpponent();
        
        // Подсвечиваем доступные цели
        document.querySelectorAll('#opponentBoard .card').forEach(card => {
            const creature = opponent.board.find(c => c.instanceId === card.dataset.id);
            if (creature) {
                // Проверяем возможность атаки
                const canAttack = this.canAttackTarget(attacker, creature);
                if (canAttack) {
                    card.classList.add('attack-target');
                    card.addEventListener('click', () => this.executeAttack(attacker.instanceId, creature.instanceId), { once: true });
                }
            }
        });
        
        // Также можно атаковать героя
        const heroElement = document.querySelector('.opponent-header');
        if (heroElement && this.canAttackTarget(attacker, { type: 'hero' })) {
            heroElement.classList.add('attack-target');
            heroElement.addEventListener('click', () => this.executeAttack(attacker.instanceId, 'hero'), { once: true });
        }
        
        // Кнопка отмены
        setTimeout(() => {
            const cancelHandler = (e) => {
                if (!e.target.closest('.attack-target')) {
                    this.clearAttackTargets();
                    document.removeEventListener('click', cancelHandler);
                }
            };
            document.addEventListener('click', cancelHandler);
        }, 100);
    }
    
    clearAttackTargets() {
        document.querySelectorAll('.attack-target').forEach(el => {
            el.classList.remove('attack-target');
        });
    }
    
    canAttackTarget(attacker, target) {
        if (target.type === 'hero') {
            // Стрелок может атаковать героя всегда
            if (attacker.abilities?.includes('archer')) return true;
            
            // Летающий может атаковать героя, если нет летающих
            if (attacker.abilities?.includes('flying')) {
                const opponent = this.getOpponent();
                const hasFlyers = opponent.board.some(c => c.abilities?.includes('flying'));
                return !hasFlyers;
            }
            
            // Обычные могут атаковать героя, если нет существ
            const opponent = this.getOpponent();
            return opponent.board.length === 0;
        } else {
            // Атака существа
            if (attacker.abilities?.includes('archer')) {
                // Стрелок может атаковать только летающих
                return target.abilities?.includes('flying');
            }
            
            return true;
        }
    }
    
    // Игровые действия
    playCard() {
        if (!this.selectedCard || !this.isPlayer) {
            this.addGameLog('Выберите карту для розыгрыша', 'error');
            return;
        }
        
        const player = this.getPlayer();
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        if (player.mana < this.selectedCard.cost) {
            this.addGameLog('Недостаточно маны', 'error');
            return;
        }
        
        this.sendToServer({
            type: 'play_card',
            cardId: this.selectedCard.instanceId,
            target: null
        });
        
        this.selectedCard = null;
        this.updateControls(true);
    }
    
    attack() {
        this.addGameLog('Выберите существо для атаки', 'info');
    }
    
    executeAttack(attackerId, targetId) {
        this.clearAttackTargets();
        
        this.sendToServer({
            type: 'attack',
            attackerId: attackerId,
            targetId: targetId
        });
    }
    
    autoAttack() {
        this.sendToServer({
            type: 'auto_attack'
        });
    }
    
    endTurn() {
        this.sendToServer({
            type: 'end_turn'
        });
    }
    
    drawCard() {
        this.sendToServer({
            type: 'draw_card'
        });
    }
    
    // Вспомогательные методы
    getPlayer() {
        if (!this.gameState || !this.isPlayer) return null;
        
        const player1 = this.gameState.player1;
        return player1.id === this.clientId ? player1 : this.gameState.player2;
    }
    
    getOpponent() {
        if (!this.gameState || !this.isPlayer) return null;
        
        const player1 = this.gameState.player1;
        return player1.id === this.clientId ? this.gameState.player2 : player1;
    }
    
    getPlayerId() {
        const player = this.getPlayer();
        return player ? player.id : null;
    }
    
    // Таймер хода
    startTurnTimer(turnEndTime) {
        this.stopTurnTimer();
        
        const updateTimer = () => {
            const now = Date.now();
            this.timeLeft = Math.max(0, Math.floor((turnEndTime - now) / 1000));
            
            this.updateGameInfo();
            
            if (this.timeLeft <= 0) {
                this.stopTurnTimer();
                // Автоматически завершаем ход
                if (this.isPlayer && this.gameState.currentTurn === this.getPlayerId()) {
                    this.endTurn();
                }
            }
        };
        
        updateTimer();
        this.turnTimer = setInterval(updateTimer, 1000);
    }
    
    stopTurnTimer() {
        if (this.turnTimer) {
            clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Чат
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendToServer({
                type: 'chat_message',
                message: message
            });
            
            input.value = '';
            input.focus();
        }
    }
    
    addChatMessage(sender, message, timestamp) {
        const container = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${sender}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
        
        // Ограничиваем количество сообщений
        const messages = container.querySelectorAll('.chat-message');
        if (messages.length > GameConfig.ui.maxChatMessages) {
            messages[0].remove();
        }
    }
    
    addGameLog(message, type = 'info') {
        const container = document.getElementById('gameLog');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const icon = this.getLogIcon(type);
        const time = new Date().toLocaleTimeString();
        
        logEntry.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span class="log-time">[${time}]</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        container.appendChild(logEntry);
        container.scrollTop = container.scrollHeight;
        
        // Ограничиваем количество записей
        const entries = container.querySelectorAll('.log-entry');
        if (entries.length > GameConfig.ui.maxLogEntries) {
            entries[0].remove();
        }
    }
    
    getLogIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'attack': return 'bolt';
            case 'victory': return 'crown';
            case 'defeat': return 'skull';
            default: return 'info-circle';
        }
    }
    
    // Звуки
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const soundElement = document.getElementById(`sound${soundName.charAt(0).toUpperCase() + soundName.slice(1)}`);
        if (soundElement) {
            try {
                soundElement.volume = GameConfig.sounds.volume;
                soundElement.currentTime = 0;
                soundElement.play().catch(e => console.log('Не удалось воспроизвести звук:', e));
            } catch (e) {
                console.log('Ошибка воспроизведения звука:', e);
            }
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        
        if (this.soundEnabled) {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundBtn.title = 'Выключить звук';
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundBtn.title = 'Включить звук';
        }
    }
    
    // Меню игры
    showGameMenu() {
        document.getElementById('gameMenuModal').classList.add('active');
    }
    
    hideGameMenu() {
        document.getElementById('gameMenuModal').classList.remove('active');
    }
    
    // Частицы на фоне
    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        
        const particleCount = Math.min(20, Math.floor(window.innerWidth / 50));
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = 15 + Math.random() * 10;
            const delay = Math.random() * 15;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
        }
    }
    
    // Топ карты на главном экране
    updateTopCards() {
        const container = document.getElementById('topCards');
        if (!container) return;
        
        // Берем 4 случайные легендарные или эпические карты
        const topCards = GameConfig.cards
            .filter(card => card.rarity === 'legendary' || card.rarity === 'epic')
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        
        container.innerHTML = topCards.map(card => {
            const rarityColor = GameConfig.getRarityColor(card.rarity);
            return `
                <div class="preview-card rarity-${card.rarity}">
                    <div class="preview-card-header" style="border-color: ${rarityColor}">
                        <div class="preview-card-cost" style="background: ${rarityColor}">
                            ${card.cost}
                        </div>
                        <div class="preview-card-name">${card.name}</div>
                    </div>
                    <div class="preview-card-image">
                        ${card.image || '<i class="fas fa-card"></i>'}
                    </div>
                    <div class="preview-card-type">${card.type === 'creature' ? 'Существо' : 'Заклинание'}</div>
                </div>
            `;
        }).join('');
    }
    
    // Адаптация под размер экрана
    handleResize() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;
        
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet && !isMobile);
        document.body.classList.toggle('desktop', !isMobile && !isTablet);
        
        // Обновляем размеры карт
        const scale = isMobile ? GameConfig.ui.cardScaleMobile : 1;
        document.documentElement.style.setProperty('--card-scale', scale);
        
        // Обновляем высоту контейнеров
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen && gameScreen.classList.contains('active-screen')) {
            const headerHeight = document.querySelector('.game-header').offsetHeight;
            const controlHeight = document.querySelector('.control-panel').offsetHeight;
            const availableHeight = window.innerHeight - headerHeight - controlHeight - 40;
            
            const opponentSection = document.querySelector('.opponent-section');
            const playerSection = document.querySelector('.player-section-game');
            
            if (opponentSection && playerSection) {
                opponentSection.style.maxHeight = `${availableHeight / 2}px`;
                playerSection.style.maxHeight = `${availableHeight / 2}px`;
            }
        }
    }
    
    // Вспомогательные функции
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация клиента при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Инициализация BattleScript клиента...');
    window.gameClient = new BattleScriptClient();
    
    // Добавляем кнопку отладки
    const debugBtn = document.createElement('button');
    debugBtn.innerHTML = '🐞 Debug';
    debugBtn.style.cssText = 'position: fixed; bottom: 10px; right: 10px; padding: 5px 10px; background: #f59e0b; color: white; border: none; border-radius: 5px; z-index: 9999;';
    debugBtn.onclick = () => {
        if (window.gameClient) {
            gameClient.sendToServer({ type: 'debug_state' });
            console.log('🐞 Текущее состояние:', {
                clientId: gameClient.clientId,
                gameId: gameClient.currentGameId,
                isPlayer: gameClient.isPlayer,
                isSpectator: gameClient.isSpectator,
                gameState: gameClient.gameState
            });
        }
    };
    document.body.appendChild(debugBtn);
});