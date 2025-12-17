// Клиентская часть BattleScript
class BattleScriptClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.playerName = null;
        this.playerAvatar = 'warrior';
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null; // 'attack', 'spell', 'artifact'
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
        this.setupAvatarSelection();
        
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
        document.getElementById('attackBtn').addEventListener('click', () => this.initiateAttack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playCard());
        document.getElementById('autoAttackBtn').addEventListener('click', () => this.autoAttack());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
        document.getElementById('useArtifactBtn').addEventListener('click', () => this.initiateArtifactUse());
        
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
    
    setupAvatarSelection() {
        const avatarsGrid = document.getElementById('avatarsGrid');
        if (!avatarsGrid) return;
        
        avatarsGrid.innerHTML = GameConfig.avatars.map(avatar => `
            <div class="avatar-option ${avatar.id === this.playerAvatar ? 'selected' : ''}" 
                 data-avatar="${avatar.id}" 
                 style="border-color: ${avatar.color}">
                <div class="avatar-icon" style="color: ${avatar.color}">
                    <i class="fas ${avatar.icon}"></i>
                </div>
                <div class="avatar-name">${avatar.name}</div>
                <div class="avatar-description">${avatar.description}</div>
                <div class="avatar-stats">
                    <span class="stat-item"><i class="fas fa-heart"></i> ${avatar.bonusHealth > 0 ? '+' : ''}${avatar.bonusHealth}</span>
                    <span class="stat-item"><i class="fas fa-gem"></i> ${avatar.bonusMana > 0 ? '+' : ''}${avatar.bonusMana}</span>
                </div>
            </div>
        `).join('');
        
        // Обработчики выбора аватара
        avatarsGrid.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                avatarsGrid.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.playerAvatar = option.dataset.avatar;
                
                // Обновляем отображение аватара
                const avatarData = GameConfig.getAvatarById(this.playerAvatar);
                if (avatarData) {
                    const avatarDisplay = document.getElementById('avatarDisplay');
                    avatarDisplay.innerHTML = `
                        <div class="avatar-icon" style="color: ${avatarData.color}">
                            <i class="fas ${avatarData.icon}"></i>
                        </div>
                    `;
                }
            });
        });
    }
    
    connectToServer() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const port = GameConfig.server.port;
        const wsUrl = `${protocol}//${host}:${port}`;
        
        this.showLoading('Подключение к серверу...');
        
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
                
            case 'artifact_used':
                this.handleArtifactUsed(data);
                break;
                
            case 'quest_completed':
                this.handleQuestCompleted(data);
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
        }
    }
    
    handleInit(data) {
        this.clientId = data.clientId;
        this.updateServerStats(data.serverInfo);
        console.log('🎮 Инициализирован клиент:', this.clientId);
    }
    
    handleNameSet(data) {
        this.playerName = data.name;
        this.playerAvatar = data.avatar || 'warrior';
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName} (${GameConfig.getAvatarById(this.playerAvatar)?.name})`, 'info');
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
    
    handleArtifactUsed(data) {
        this.addGameLog(`${data.playerName} использует ${data.artifact} на ${data.target}`, 'info');
        this.playSound('cardPlay');
    }
    
    handleQuestCompleted(data) {
        this.addGameLog(`Получен артефакт: ${data.artifact.name}`, 'success');
        this.playSound('cardPlay');
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
        
        const avatarData = GameConfig.getAvatarById(this.playerAvatar);
        const avatarDisplay = document.getElementById('avatarDisplay');
        if (avatarData) {
            avatarDisplay.innerHTML = `
                <div class="avatar-icon" style="color: ${avatarData.color}">
                    <i class="fas ${avatarData.icon}"></i>
                </div>
                <div class="avatar-name">${avatarData.name}</div>
            `;
        }
        
        const playerStatus = document.getElementById('playerStatus');
        playerStatus.className = 'status-badge connected';
        playerStatus.innerHTML = '<i class="fas fa-sign-in-alt"></i> В игре';
    }
    
    showNameModal() {
        document.getElementById('nameModal').classList.add('active');
        document.getElementById('nameInput').focus();
        this.setupAvatarSelection();
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
                name: name,
                avatar: this.playerAvatar
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
        alert('В текущей версии наблюдатели подключаются автоматически к новым играм');
    }
    
    showGameScreen() {
        console.log('🔄 Переход на экран игры');
        
        document.getElementById('mainScreen').classList.remove('active-screen');
        document.getElementById('gameScreen').classList.add('active-screen');
        
        setTimeout(() => this.handleResize(), 100);
    }
    
    showMainScreen() {
        console.log('🔄 Возврат в главное меню');
        
        document.getElementById('gameScreen').classList.remove('active-screen');
        document.getElementById('mainScreen').classList.add('active-screen');
        
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
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        this.stopTurnTimer();
        
        document.getElementById('playerHand').innerHTML = '';
        document.getElementById('playerBoardGrid').innerHTML = '';
        document.getElementById('opponentHand').innerHTML = '';
        document.getElementById('opponentBoardGrid').innerHTML = '';
        document.getElementById('gameLog').innerHTML = '';
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('artifactContainer').innerHTML = '';
        
        const playerStatus = document.getElementById('playerStatus');
        playerStatus.className = 'status-badge disconnected';
        playerStatus.innerHTML = '<i class="fas fa-sign-out-alt"></i> Не в игре';
    }
    
    updatePlayerView(isPlayer1) {
        if (!this.gameState) return;
        
        const player = this.gameState.player;
        const opponent = this.gameState.opponent;
        
        // Обновляем информацию о игроке
        document.getElementById('gamePlayerName').textContent = this.playerName;
        document.getElementById('gameCurrentPlayerName').textContent = this.playerName;
        document.getElementById('playerMana').textContent = player.mana;
        document.getElementById('playerMaxMana').textContent = player.maxMana;
        document.getElementById('playerHealth').textContent = player.health;
        document.getElementById('playerHandCount').textContent = player.hand?.length || 0;
        
        // Обновляем аватар игрока
        const playerAvatar = document.getElementById('playerAvatar');
        const playerAvatarData = GameConfig.getAvatarById(player.avatar);
        if (playerAvatarData) {
            playerAvatar.innerHTML = `<i class="fas ${playerAvatarData.icon}" style="color: ${playerAvatarData.color}"></i>`;
            playerAvatar.style.borderColor = playerAvatarData.color;
        }
        
        // Обновляем информацию о противнике
        document.getElementById('opponentName').textContent = opponent.name;
        document.getElementById('opponentMana').textContent = opponent.mana;
        document.getElementById('opponentMaxMana').textContent = opponent.maxMana;
        document.getElementById('opponentHealth').textContent = opponent.health;
        document.getElementById('opponentHandCount').textContent = opponent.handSize || 0;
        
        // Обновляем аватар противника
        const opponentAvatar = document.getElementById('opponentAvatar');
        const opponentAvatarData = GameConfig.getAvatarById(opponent.avatar);
        if (opponentAvatarData) {
            opponentAvatar.innerHTML = `<i class="fas ${opponentAvatarData.icon}" style="color: ${opponentAvatarData.color}"></i>`;
            opponentAvatar.style.borderColor = opponentAvatarData.color;
        }
        
        // Обновляем квест
        if (player.quest) {
            const questElement = document.getElementById('currentQuest');
            const progress = Math.min(player.quest.progress, player.quest.requirement);
            const percent = (progress / player.quest.requirement) * 100;
            questElement.innerHTML = `
                <i class="fas fa-scroll"></i>
                <span>Квест: ${player.quest.description} (${progress}/${player.quest.requirement})</span>
                <div class="quest-progress">
                    <div class="progress-bar" style="width: ${percent}%"></div>
                </div>
            `;
        }
        
        // Рендерим руку и поле игрока
        this.renderHand('playerHand', player.hand || []);
        this.renderBoard('playerBoardGrid', player.board || [], true);
        
        // Рука противника скрыта
        this.renderHiddenHand('opponentHand', opponent.handSize || 0);
        this.renderBoard('opponentBoardGrid', opponent.board || [], false);
        
        // Рендерим артефакты
        this.renderArtifacts('artifactContainer', player.artifacts || []);
        
        // Обновляем статус хода
        const isMyTurn = this.gameState.currentTurn === player.id;
        this.updateTurnIndicator(isMyTurn);
    }
    
    updateSpectatorView() {
        if (!this.gameState) return;
        
        const player1 = this.gameState.player1;
        const player2 = this.gameState.player2;
        
        document.getElementById('gamePlayerName').textContent = 'Наблюдатель';
        document.getElementById('gameCurrentPlayerName').textContent = 'Наблюдатель';
        
        // Игрок 1 (снизу)
        const avatar1 = GameConfig.getAvatarById(player1.avatar);
        if (avatar1) {
            document.getElementById('playerAvatar').innerHTML = `<i class="fas ${avatar1.icon}" style="color: ${avatar1.color}"></i>`;
            document.getElementById('playerAvatar').style.borderColor = avatar1.color;
        }
        
        document.getElementById('playerName').textContent = player1.name;
        document.getElementById('playerMana').textContent = player1.mana;
        document.getElementById('playerMaxMana').textContent = player1.maxMana;
        document.getElementById('playerHealth').textContent = player1.health;
        document.getElementById('playerHandCount').textContent = player1.handSize || 0;
        
        // Игрок 2 (сверху)
        const avatar2 = GameConfig.getAvatarById(player2.avatar);
        if (avatar2) {
            document.getElementById('opponentAvatar').innerHTML = `<i class="fas ${avatar2.icon}" style="color: ${avatar2.color}"></i>`;
            document.getElementById('opponentAvatar').style.borderColor = avatar2.color;
        }
        
        document.getElementById('opponentName').textContent = player2.name;
        document.getElementById('opponentMana').textContent = player2.mana;
        document.getElementById('opponentMaxMana').textContent = player2.maxMana;
        document.getElementById('opponentHealth').textContent = player2.health;
        document.getElementById('opponentHandCount').textContent = player2.handSize || 0;
        
        // Рендерим обе стороны
        this.renderHiddenHand('playerHand', player1.handSize || 0);
        this.renderBoard('playerBoardGrid', player1.board || [], false);
        
        this.renderHiddenHand('opponentHand', player2.handSize || 0);
        this.renderBoard('opponentBoardGrid', player2.board || [], false);
        
        document.getElementById('artifactContainer').innerHTML = '<div class="empty-artifacts"><i class="fas fa-treasure-chest"></i><span>Артефакты скрыты</span></div>';
    }
    
    updateGameBoard() {
        if (!this.gameState) return;
        
        const turnIndicator = document.getElementById('turnIndicator');
        const currentPlayerId = this.gameState.currentTurn;
        const currentPlayer = currentPlayerId === this.gameState.player?.id ? 
                             this.gameState.player : this.gameState.opponent;
        
        if (this.gameState.status === 'active') {
            turnIndicator.className = 'turn-indicator active';
            turnIndicator.innerHTML = `<i class="fas fa-hourglass-start"></i><span>Ход: ${currentPlayer.name}</span>`;
        } else {
            turnIndicator.className = 'turn-indicator waiting';
            turnIndicator.innerHTML = `<i class="fas fa-hourglass-half"></i><span>Ожидание...</span>`;
        }
        
        // Обновляем счетчик артефактов
        document.getElementById('artifactDeckCount').textContent = this.gameState.artifactDeckSize || 0;
    }
    
    updateGameInfo() {
        if (!this.gameState) return;
        
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
            'useArtifactBtn'
        ];
        
        const isEnabled = this.isPlayer && isMyTurn && this.gameState?.status === 'active';
        
        controls.forEach(controlId => {
            const control = document.getElementById(controlId);
            if (control) {
                control.disabled = !isEnabled;
                control.style.opacity = isEnabled ? '1' : '0.5';
            }
        });
        
        // Обновляем текст кнопок
        const playBtn = document.getElementById('playCardBtn');
        if (this.selectedCard) {
            const shortName = this.selectedCard.name.length > 10 
                ? this.selectedCard.name.substring(0, 10) + '...' 
                : this.selectedCard.name;
            playBtn.innerHTML = `<i class="fas fa-play"></i><span>Играть ${shortName}</span>`;
        } else {
            playBtn.innerHTML = `<i class="fas fa-play"></i><span>Играть карту</span>`;
        }
        
        const artifactBtn = document.getElementById('useArtifactBtn');
        if (this.selectedArtifact) {
            const shortName = this.selectedArtifact.name.length > 8 
                ? this.selectedArtifact.name.substring(0, 8) + '...' 
                : this.selectedArtifact.name;
            artifactBtn.innerHTML = `<i class="fas fa-magic"></i><span>Исп. ${shortName}</span>`;
        } else {
            artifactBtn.innerHTML = `<i class="fas fa-magic"></i><span>Исп. артефакт</span>`;
        }
    }
    
    renderHand(containerId, hand) {
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
        
        hand.forEach((card) => {
            const cardElement = this.createCardElement(card, 'hand');
            container.appendChild(cardElement);
            
            // Добавляем обработчик выбора карты
            cardElement.addEventListener('click', () => {
                if (this.targetMode) {
                    this.cancelTargetMode();
                } else {
                    this.selectCard(card);
                }
            });
            
            // Добавляем эффект блика
            this.addCardGlowEffect(cardElement);
        });
    }
    
    renderBoard(containerId, board, isOwnBoard) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Создаем ячейки, если их нет
        if (container.children.length === 0) {
            for (let i = 0; i < 5; i++) {
                const cell = document.createElement('div');
                cell.className = `board-cell cell-${i + 1} ${i === 0 || i === 4 ? 'special-cell' : ''}`;
                cell.dataset.cell = i;
                cell.title = i === 0 ? 'Ячейка 1: Немедленная атака' : 
                           i === 4 ? 'Ячейка 5: Скрытность' : `Ячейка ${i + 1}`;
                container.appendChild(cell);
            }
        }
        
        // Очищаем ячейки
        container.querySelectorAll('.board-cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'can-attack', 'attack-target');
        });
        
        if (!board || board.length === 0) return;
        
        board.forEach((creature, index) => {
            if (creature) {
                const cell = container.querySelector(`[data-cell="${index}"]`);
                if (cell) {
                    cell.classList.add('occupied');
                    
                    const cardElement = this.createCardElement(creature, 'board');
                    
                    // Добавляем иконки статусов
                    const statusIcons = document.createElement('div');
                    statusIcons.className = 'creature-status';
                    
                    if (creature.canAttack && !creature.hasAttacked) {
                        const attackIcon = document.createElement('div');
                        attackIcon.className = 'status-icon can-attack-icon';
                        attackIcon.innerHTML = '<i class="fas fa-bolt"></i>';
                        attackIcon.title = 'Может атаковать';
                        statusIcons.appendChild(attackIcon);
                        
                        // Добавляем обработчик для атаки
                        cardElement.addEventListener('click', () => {
                            if (this.targetMode === 'attack') {
                                this.cancelTargetMode();
                            } else if (isOwnBoard && !this.targetMode) {
                                this.selectAttacker(creature);
                            }
                        });
                    }
                    
                    if (creature.stealth) {
                        const stealthIcon = document.createElement('div');
                        stealthIcon.className = 'status-icon stealth-icon';
                        stealthIcon.innerHTML = '<i class="fas fa-eye-slash"></i>';
                        stealthIcon.title = 'Скрытность (нельзя атаковать)';
                        statusIcons.appendChild(stealthIcon);
                    }
                    
                    if (creature.frozen) {
                        const frozenIcon = document.createElement('div');
                        frozenIcon.className = 'status-icon frozen-icon';
                        frozenIcon.innerHTML = '<i class="fas fa-snowflake"></i>';
                        frozenIcon.title = 'Заморожен (не может атаковать)';
                        statusIcons.appendChild(frozenIcon);
                    }
                    
                    cardElement.appendChild(statusIcons);
                    cell.appendChild(cardElement);
                    
                    // Добавляем эффект блика
                    this.addCardGlowEffect(cardElement);
                }
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
    
    renderArtifacts(containerId, artifacts) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!artifacts || artifacts.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-artifacts';
            emptyMsg.innerHTML = '<i class="fas fa-treasure-chest"></i><span>Артефактов нет</span>';
            container.appendChild(emptyMsg);
            return;
        }
        
        artifacts.forEach((artifact) => {
            const artifactElement = document.createElement('div');
            artifactElement.className = 'artifact-item';
            artifactElement.dataset.id = artifact.instanceId;
            
            const rarityColor = GameConfig.getRarityColor(artifact.rarity);
            
            artifactElement.innerHTML = `
                <div class="artifact-icon" style="color: ${rarityColor}">
                    <i class="fas ${artifact.image || 'fa-gem'}"></i>
                </div>
                <div class="artifact-info">
                    <div class="artifact-name">${artifact.name}</div>
                    <div class="artifact-description">${artifact.description}</div>
                    <div class="artifact-requirements">
                        ${artifact.requirements?.map(req => `<span class="req-tag">${req}</span>`).join('') || ''}
                    </div>
                </div>
            `;
            
            artifactElement.addEventListener('click', () => {
                if (this.targetMode === 'artifact') {
                    this.cancelTargetMode();
                } else {
                    this.selectArtifact(artifact);
                }
            });
            
            container.appendChild(artifactElement);
        });
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
                        const abilityIcon = GameConfig.getAbilityIcon(abilityId);
                        return `<span class="ability-badge" title="${GameConfig.getAbilityDescription(abilityId)}">
                            <i class="fas ${abilityIcon}"></i> ${abilityName}
                        </span>`;
                    }).join('')}
                </div>
            `;
        }
        
        let statsHTML = '';
        if (cardData.type === 'creature') {
            const health = cardData.currentHealth || cardData.health;
            const maxHealth = cardData.maxHealth || cardData.health;
            const attack = cardData.attack + (cardData.bonuses?.attack || 0);
            const totalHealth = health + (cardData.bonuses?.health || 0);
            
            statsHTML = `
                <div class="card-stats">
                    <div class="stat attack" title="Сила атаки">
                        <i class="fas fa-bolt"></i>
                        <span class="stat-value">${attack}</span>
                    </div>
                    <div class="stat health" title="Здоровье">
                        <i class="fas fa-heart"></i>
                        <span class="stat-value">${totalHealth}</span>
                    </div>
                </div>
            `;
        } else if (cardData.type === 'spell') {
            statsHTML = `
                <div class="card-stats">
                    <div class="stat effect" title="Сила эффекта">
                        <i class="fas fa-magic"></i>
                        <span class="stat-value">${cardData.value || 0}</span>
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
    
    addCardGlowEffect(cardElement) {
        // Добавляем анимацию блика
        const shine = document.createElement('div');
        shine.className = 'card-shine';
        cardElement.appendChild(shine);
        
        // Запускаем анимацию
        setTimeout(() => {
            shine.style.animation = 'shine 4s linear infinite';
        }, 100);
    }
    
    selectCard(card) {
        if (!this.isPlayer || !this.gameState) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        // Снимаем выделение
        this.clearSelections();
        
        // Выделяем карту
        const cardElement = document.querySelector(`[data-id="${card.instanceId}"]`);
        if (cardElement) {
            cardElement.classList.add('selected');
        }
        
        this.selectedCard = card;
        this.updateControls(this.isPlayer && this.gameState.currentTurn === this.getPlayerId());
        
        // Если это заклинание, переходим в режим выбора цели
        if (card.type === 'spell') {
            this.showSpellTargets(card);
        }
    }
    
    selectArtifact(artifact) {
        if (!this.isPlayer || !this.gameState) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        // Снимаем выделение
        this.clearSelections();
        
        // Выделяем артефакт
        const artifactElement = document.querySelector(`[data-id="${artifact.instanceId}"]`);
        if (artifactElement) {
            artifactElement.classList.add('selected');
        }
        
        this.selectedArtifact = artifact;
        this.targetMode = 'artifact';
        this.showArtifactTargets(artifact);
        
        this.updateControls(true);
    }
    
    selectAttacker(creature) {
        if (!this.isPlayer || !this.gameState) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        if (!creature.canAttack || creature.hasAttacked) {
            this.addGameLog('Это существо не может атаковать', 'error');
            return;
        }
        
        this.selectedAttacker = creature;
        this.targetMode = 'attack';
        this.showAttackTargets(creature);
    }
    
    showAttackTargets(attacker) {
        const opponent = this.gameState.opponent;
        
        // Подсвечиваем доступные цели
        opponent.board.forEach((creature, cell) => {
            if (creature) {
                // Проверяем скрытность
                if (creature.stealth && !creature.hasAttacked) {
                    return;
                }
                
                const cellElement = document.querySelector(`#opponentBoardGrid [data-cell="${cell}"]`);
                if (cellElement) {
                    cellElement.classList.add('attack-target');
                    
                    // Добавляем обработчик
                    const handler = () => {
                        this.executeAttack(attacker.instanceId, cell.toString());
                        cellElement.removeEventListener('click', handler);
                    };
                    cellElement.addEventListener('click', handler);
                }
            }
        });
        
        // Также можно атаковать героя (если нет существ с провокацией)
        const hasTaunt = opponent.board.some(c => c && c.abilities?.includes('taunt'));
        if (!hasTaunt) {
            const heroElement = document.getElementById('opponentHero');
            if (heroElement) {
                heroElement.classList.add('attack-target');
                
                const handler = () => {
                    this.executeAttack(attacker.instanceId, 'hero');
                    heroElement.removeEventListener('click', handler);
                };
                heroElement.addEventListener('click', handler);
            }
        }
        
        this.addGameLog('Выберите цель для атаки', 'info');
    }
    
    showSpellTargets(spell) {
        const opponent = this.gameState.opponent;
        const player = this.gameState.player;
        
        this.targetMode = 'spell';
        
        // В зависимости от заклинания показываем цели
        switch (spell.effect) {
            case 'damage':
            case 'heal':
                // Можно выбрать героя или существо
                if (spell.effect === 'heal') {
                    // Для исцеления - свои цели
                    player.board.forEach((creature, cell) => {
                        if (creature) {
                            const cellElement = document.querySelector(`#playerBoardGrid [data-cell="${cell}"]`);
                            if (cellElement) {
                                cellElement.classList.add('spell-target');
                                
                                const handler = () => {
                                    this.playSpell(spell.instanceId, cell.toString());
                                    cellElement.removeEventListener('click', handler);
                                };
                                cellElement.addEventListener('click', handler);
                            }
                        }
                    });
                    
                    // И героя
                    const heroElement = document.getElementById('playerHero');
                    if (heroElement) {
                        heroElement.classList.add('spell-target');
                        
                        const handler = () => {
                            this.playSpell(spell.instanceId, 'hero');
                            heroElement.removeEventListener('click', handler);
                        };
                        heroElement.addEventListener('click', handler);
                    }
                } else {
                    // Для урона - цели противника
                    opponent.board.forEach((creature, cell) => {
                        if (creature) {
                            const cellElement = document.querySelector(`#opponentBoardGrid [data-cell="${cell}"]`);
                            if (cellElement) {
                                cellElement.classList.add('spell-target');
                                
                                const handler = () => {
                                    this.playSpell(spell.instanceId, cell.toString());
                                    cellElement.removeEventListener('click', handler);
                                };
                                cellElement.addEventListener('click', handler);
                            }
                        }
                    });
                    
                    // И героя противника
                    const heroElement = document.getElementById('opponentHero');
                    if (heroElement) {
                        heroElement.classList.add('spell-target');
                        
                        const handler = () => {
                            this.playSpell(spell.instanceId, 'hero');
                            heroElement.removeEventListener('click', handler);
                        };
                        heroElement.addEventListener('click', handler);
                    }
                }
                break;
                
            case 'damage_all':
            case 'freeze_all':
                // Не требуют выбора цели
                this.playSpell(spell.instanceId, 'all');
                break;
        }
        
        if (spell.effect !== 'damage_all' && spell.effect !== 'freeze_all') {
            this.addGameLog('Выберите цель для заклинания', 'info');
        }
    }
    
    showArtifactTargets(artifact) {
        const player = this.gameState.player;
        
        // Можно выбрать героя или существо
        player.board.forEach((creature, cell) => {
            if (creature) {
                // Проверяем требования артефакта
                const meetsRequirements = artifact.requirements.every(req => {
                    return creature.tags?.includes(req);
                });
                
                if (meetsRequirements) {
                    const cellElement = document.querySelector(`#playerBoardGrid [data-cell="${cell}"]`);
                    if (cellElement) {
                        cellElement.classList.add('artifact-target');
                        
                        const handler = () => {
                            this.useArtifact(artifact.instanceId, cell.toString());
                            cellElement.removeEventListener('click', handler);
                        };
                        cellElement.addEventListener('click', handler);
                    }
                }
            }
        });
        
        // Некоторые артефакты можно использовать на героя
        if (!artifact.requirements || artifact.requirements.length === 0) {
            const heroElement = document.getElementById('playerHero');
            if (heroElement) {
                heroElement.classList.add('artifact-target');
                
                const handler = () => {
                    this.useArtifact(artifact.instanceId, 'hero');
                    heroElement.removeEventListener('click', handler);
                };
                heroElement.addEventListener('click', handler);
            }
        }
        
        this.addGameLog('Выберите цель для артефакта', 'info');
    }
    
    clearSelections() {
        // Снимаем выделение со всех карт и артефактов
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
    }
    
    cancelTargetMode() {
        this.clearSelections();
        this.targetMode = null;
        
        // Убираем подсветку целей
        document.querySelectorAll('.attack-target, .spell-target, .artifact-target').forEach(el => {
            el.classList.remove('attack-target', 'spell-target', 'artifact-target');
        });
        
        this.updateControls(this.isPlayer && this.gameState.currentTurn === this.getPlayerId());
        this.addGameLog('Режим выбора цели отменен', 'info');
    }
    
    // Игровые действия
    initiateAttack() {
        if (this.targetMode) {
            this.cancelTargetMode();
        } else {
            this.addGameLog('Выберите существо для атаки', 'info');
        }
    }
    
    playCard() {
        if (!this.selectedCard || !this.isPlayer) {
            this.addGameLog('Выберите карту для розыгрыша', 'error');
            return;
        }
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            return;
        }
        
        if (player.mana < this.selectedCard.cost) {
            this.addGameLog('Недостаточно маны', 'error');
            return;
        }
        
        // Для существ нужно выбрать ячейку
        if (this.selectedCard.type === 'creature') {
            this.addGameLog('Выберите ячейку для существа (1-5)', 'info');
            
            // Показываем доступные ячейки
            for (let i = 0; i < player.board.length; i++) {
                if (!player.board[i]) {
                    const cellElement = document.querySelector(`#playerBoardGrid [data-cell="${i}"]`);
                    if (cellElement) {
                        cellElement.classList.add('play-target');
                        
                        const handler = () => {
                            this.sendToServer({
                                type: 'play_card',
                                cardId: this.selectedCard.instanceId,
                                cell: i
                            });
                            
                            cellElement.removeEventListener('click', handler);
                            document.querySelectorAll('.play-target').forEach(el => {
                                el.classList.remove('play-target');
                            });
                        };
                        cellElement.addEventListener('click', handler);
                    }
                }
            }
        } else if (this.selectedCard.type === 'spell') {
            // Для заклинаний уже был выбор цели
            if (!this.targetMode) {
                this.showSpellTargets(this.selectedCard);
            }
        }
    }
    
    playSpell(cardId, target) {
        this.sendToServer({
            type: 'play_card',
            cardId: cardId,
            cell: target
        });
        
        this.cancelTargetMode();
    }
    
    executeAttack(attackerId, targetId) {
        this.sendToServer({
            type: 'attack',
            attackerId: attackerId,
            targetId: targetId
        });
        
        this.cancelTargetMode();
    }
    
    autoAttack() {
        this.sendToServer({
            type: 'auto_attack'
        });
        
        this.cancelTargetMode();
    }
    
    endTurn() {
        this.sendToServer({
            type: 'end_turn'
        });
        
        this.cancelTargetMode();
    }
    
    initiateArtifactUse() {
        if (this.targetMode === 'artifact') {
            this.cancelTargetMode();
        } else if (this.selectedArtifact) {
            this.showArtifactTargets(this.selectedArtifact);
        } else {
            this.addGameLog('Выберите артефакт для использования', 'info');
        }
    }
    
    useArtifact(artifactId, targetId) {
        this.sendToServer({
            type: 'use_artifact',
            artifactId: artifactId,
            targetId: targetId
        });
        
        this.cancelTargetMode();
    }
    
    // Вспомогательные методы
    getPlayer() {
        return this.gameState?.player || null;
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
        
        const topCards = [...GameConfig.creatureCards, ...GameConfig.spellCards]
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
        
        const scale = isMobile ? GameConfig.ui.cardScaleMobile : 1;
        document.documentElement.style.setProperty('--card-scale', scale);
        
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
    console.log('🎮 Инициализация BattleScript клиента v3.0...');
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