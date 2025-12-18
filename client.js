// BattleScript Pro Client - Улучшенная версия
class BattleScriptProClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.playerName = null;
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        
        // Состояние игры
        this.selectedCard = null;
<<<<<<< Updated upstream
=======
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        
        // Таймер
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        this.turnTimer = null;
        this.timeLeft = 120;
        
        // Статус подключения
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Боковая панель
        this.sidePanelOpen = false;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.createParticles();
        this.connectToServer();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        this.updateTopCards();
        
        // Обновляем размеры при загрузке
        setTimeout(() => this.handleResize(), 100);
=======
        this.setupAvatarSelection();
        this.setupBoardCells();
        this.handleResize();
        
=======
        this.setupAvatarSelection();
        this.setupBoardCells();
        this.handleResize();
        
>>>>>>> Stashed changes
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // Показать подсказку для новых игроков
        setTimeout(() => {
            if (!localStorage.getItem('battlescript_help_shown')) {
                this.addGameLog('Добро пожаловать в BattleScript Pro! Для начала игры нажмите "Войти в игру"', 'info');
                localStorage.setItem('battlescript_help_shown', 'true');
            }
        }, 2000);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    setupEventListeners() {
        // Главный экран
        document.getElementById('enterNameBtn').addEventListener('click', () => this.showNameModal());
        document.getElementById('quickJoinBtn').addEventListener('click', () => this.quickJoin());
        document.getElementById('findOpponentBtn').addEventListener('click', () => this.findOpponent());
        document.getElementById('spectateBtn').addEventListener('click', () => this.showSpectateModal());
        document.getElementById('deckBuilderBtn').addEventListener('click', () => this.showDeckBuilder());
        
        // Модальное окно входа
        document.getElementById('confirmNameBtn').addEventListener('click', () => this.confirmName());
        document.getElementById('cancelNameBtn').addEventListener('click', () => this.hideNameModal());
        document.getElementById('closeNameModal').addEventListener('click', () => this.hideNameModal());
        document.getElementById('nameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmName();
        });
        
        // Предложенные имена
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('nameInput').value = e.target.dataset.name;
            });
        });
        
        // Игровой экран
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        document.getElementById('exitGameBtn').addEventListener('click', () => this.returnToMain());
        document.getElementById('menuBtn').addEventListener('click', () => this.showGameMenu());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        
        // Управление игрой
        document.getElementById('attackBtn').addEventListener('click', () => this.attack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playCard());
=======
        document.getElementById('attackBtn').addEventListener('click', () => this.initiateAttack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playSelectedCard());
>>>>>>> Stashed changes
        document.getElementById('autoAttackBtn').addEventListener('click', () => this.autoAttack());
        document.getElementById('useArtifactBtn').addEventListener('click', () => this.useSelectedArtifact());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
<<<<<<< Updated upstream
        document.getElementById('drawCardBtn').addEventListener('click', () => this.drawCard());
=======
=======
        document.getElementById('attackBtn').addEventListener('click', () => this.initiateAttack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playSelectedCard());
        document.getElementById('autoAttackBtn').addEventListener('click', () => this.autoAttack());
        document.getElementById('useArtifactBtn').addEventListener('click', () => this.useSelectedArtifact());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
>>>>>>> Stashed changes
        
        // Боковая панель
        document.getElementById('panelToggle').addEventListener('click', () => this.toggleSidePanel());
        
        // Вкладки боковой панели
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        
        // Чат
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Колоды
        document.getElementById('artifactDeckSide').addEventListener('click', () => this.showArtifactInfo());
        document.getElementById('playerDeckSide').addEventListener('click', () => this.showDeckInfo());
        
        // Клик вне режима выбора цели
        document.addEventListener('click', (e) => {
            if (this.targetMode && 
                !e.target.closest('.card-in-hand') && 
                !e.target.closest('.board-cell') && 
                !e.target.closest('.control-btn')) {
                this.cancelTargetMode();
            }
        });
<<<<<<< Updated upstream
=======
    }
    
    setupBoardCells() {
        const playerGrid = document.getElementById('playerBoardGrid');
        const opponentGrid = document.getElementById('opponentBoardGrid');
        
        // Создаем 5 ячеек для каждого игрока
        for (let i = 0; i < 5; i++) {
            const playerCell = document.createElement('div');
            playerCell.className = `board-cell ${i === 0 || i === 4 ? 'special-cell' : ''}`;
            playerCell.dataset.cell = i;
            playerCell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
            
            const opponentCell = document.createElement('div');
            opponentCell.className = `board-cell ${i === 0 || i === 4 ? 'special-cell' : ''}`;
            opponentCell.dataset.cell = i;
            opponentCell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
            
            playerCell.addEventListener('click', () => this.handleCellClick(playerCell));
            opponentCell.addEventListener('click', () => this.handleCellClick(opponentCell));
            
            playerGrid.appendChild(playerCell);
            opponentGrid.appendChild(opponentCell);
        }
>>>>>>> Stashed changes
    }
    
<<<<<<< Updated upstream
=======
    setupBoardCells() {
        const playerGrid = document.getElementById('playerBoardGrid');
        const opponentGrid = document.getElementById('opponentBoardGrid');
        
        // Создаем 5 ячеек для каждого игрока
        for (let i = 0; i < 5; i++) {
            const playerCell = document.createElement('div');
            playerCell.className = `board-cell ${i === 0 || i === 4 ? 'special-cell' : ''}`;
            playerCell.dataset.cell = i;
            playerCell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
            
            const opponentCell = document.createElement('div');
            opponentCell.className = `board-cell ${i === 0 || i === 4 ? 'special-cell' : ''}`;
            opponentCell.dataset.cell = i;
            opponentCell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
            
            playerCell.addEventListener('click', () => this.handleCellClick(playerCell));
            opponentCell.addEventListener('click', () => this.handleCellClick(opponentCell));
            
            playerGrid.appendChild(playerCell);
            opponentGrid.appendChild(opponentCell);
        }
    }
    
>>>>>>> Stashed changes
    connectToServer() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const port = 3000;
        const wsUrl = `${protocol}//${host}:${port}`;
        
        this.showLoading('Подключение к серверу...');
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
        try {
            this.ws = new WebSocket(wsUrl);
>>>>>>> Stashed changes
=======
        try {
            this.ws = new WebSocket(wsUrl);
>>>>>>> Stashed changes
            
            this.ws.onopen = () => {
                console.log('✅ Подключено к серверу');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                this.hideLoading();
                this.addGameLog('Соединение с сервером установлено', 'success');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения:', error);
                    this.addGameLog('Ошибка обработки сообщения от сервера', 'error');
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('❌ Отключено от сервера:', event.code, event.reason);
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                if (this.currentGameId && this.isPlayer) {
                    this.addGameLog('Потеряно соединение с сервером', 'error');
                }
                
                // Попытка переподключения
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
                    
                    console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}ms`);
                    
                    setTimeout(() => {
                        if (!this.isConnected) {
                            this.connectToServer();
                        }
                    }, delay);
                } else {
                    this.showLoading('Не удалось подключиться к серверу');
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket ошибка:', error);
                this.hideLoading();
                this.showLoading('Ошибка подключения...');
            };
            
        } catch (error) {
            console.error('❌ Ошибка создания WebSocket:', error);
            this.showLoading('Ошибка подключения к серверу');
        }
    }
    
    sendToServer(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(data));
                console.log('📤 Отправлено:', data.type);
                return true;
            } catch (error) {
                console.error('❌ Ошибка отправки:', error);
                this.addGameLog('Ошибка отправки данных', 'error');
                return false;
            }
        } else {
            console.error('❌ WebSocket не подключен');
            this.addGameLog('Нет соединения с сервером', 'error');
            return false;
        }
    }
    
    handleServerMessage(data) {
        console.log('📨 Получено:', data.type);
        
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
                
            case 'game_state':
                this.handleGameState(data);
                break;
                
            case 'game_started':
                this.handleGameStarted(data);
                break;
                
            case 'game_ended':
                this.handleGameEnded(data);
                break;
                
            case 'turn_changed':
                this.handleTurnChanged(data);
                break;
                
            case 'card_played':
                this.handleCardPlayed(data);
                break;
                
            case 'attack_executed':
                this.handleAttackExecuted(data);
                break;
                
            case 'auto_attack':
                this.handleAutoAttack(data);
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
                
            case 'error':
                this.handleError(data);
                break;
                
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            case 'server_shutdown':
                this.handleServerShutdown(data);
                break;
                
            case 'debug_response':
                this.handleDebugResponse(data);
                break;
                
            case 'pong':
                // Просто отвечаем на пинг
                break;
=======
            default:
                console.warn(`⚠️ Неизвестный тип сообщения:`, data.type);
>>>>>>> Stashed changes
=======
            default:
                console.warn(`⚠️ Неизвестный тип сообщения:`, data.type);
>>>>>>> Stashed changes
        }
    }
    
    handleInit(data) {
        this.clientId = data.clientId;
        this.updateServerStats(data.serverInfo);
        console.log('🎮 Инициализирован клиент:', this.clientId);
        this.addGameLog(`Клиент инициализирован (ID: ${this.clientId.substring(0, 8)}...)`, 'info');
    }
    
    handleNameSet(data) {
        this.playerName = data.name;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName}`, 'info');
=======
        this.playerAvatar = data.avatar;
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName}`, 'success');
        this.playSound('login');
>>>>>>> Stashed changes
=======
        this.playerAvatar = data.avatar;
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName}`, 'success');
        this.playSound('login');
>>>>>>> Stashed changes
    }
    
    handleServerInfo(data) {
        this.updateServerStats(data);
    }
    
    handleJoinedQueue(data) {
        this.showLoading(`В очереди... Позиция: ${data.position}`);
        this.addGameLog(`Вы в очереди на игру (позиция: ${data.position})`, 'info');
    }
    
    handleGameState(data) {
        this.gameState = data.state;
        this.currentGameId = data.gameId;
        
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
        
        if (this.gameState.status === 'active' && this.gameState.turnEndTime) {
            const turnEndTime = new Date(this.gameState.turnEndTime).getTime();
            const now = Date.now();
            this.timeLeft = Math.max(0, Math.floor((turnEndTime - now) / 1000));
            this.startTurnTimer();
        }
        
        this.hideLoading();
    }
    
    handleGameStarted(data) {
        console.log('🎮 Игра началась!');
        
        this.currentGameId = data.gameId;
        this.gameState = data.gameState;
        
        this.showGameScreen();
        this.addGameLog('Игра началась!', 'success');
        this.playSound('gameStart');
        this.hideLoading();
    }
    
    handleGameEnded(data) {
        console.log('🏆 Игра завершена');
        
        this.stopTurnTimer();
        
        this.addGameLog(data.message, data.winnerId === this.clientId ? 'success' : 'error');
        
        if (data.winnerId === this.clientId) {
            this.playSound('victory');
        } else {
            this.playSound('defeat');
        }
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        
        setTimeout(() => {
            if (data.winnerId === this.clientId) {
                alert(`🎉 Победа! ${data.message}`);
            } else {
                alert(`💥 Поражение. ${data.message}`);
            }
            this.returnToMain();
        }, 3000);
    }
    
    handleTurnChanged(data) {
        if (this.gameState) {
            this.gameState.currentTurn = data.currentTurn;
            this.gameState.turnNumber = data.turnNumber;
            
            this.addGameLog(`Ход ${data.playerName}`, 'info');
            this.updateGameBoard();
            
            if (this.isPlayer && data.currentTurn === this.clientId) {
                this.addGameLog('Ваш ход!', 'success');
                this.playSound('yourTurn');
            } else if (this.isPlayer) {
                this.playSound('opponentTurn');
            }
            
            this.clearSelections();
        }
    }
    
    handleCardPlayed(data) {
        if (data.playerId !== this.clientId) {
            this.addGameLog(`${data.playerName} разыгрывает карту`, 'info');
            this.playSound('cardPlay');
        }
    }
    
    handleAttackExecuted(data) {
        this.addGameLog(`${data.attacker} атакует ${data.target}`, 'attack');
        this.playSound('attack');
    }
    
    handleAutoAttack(data) {
        this.addGameLog(`${data.playerName} использует авто-атаку`, 'info');
        this.playSound('attack');
    }
    
    handleArtifactUsed(data) {
        this.addGameLog(`${data.playerName} использует артефакт`, 'info');
        this.playSound('artifact');
    }
    
    handleQuestCompleted(data) {
        this.addGameLog(`Получен артефакт: ${data.artifact.name}`, 'success');
        this.playSound('questComplete');
    }
    
    handleChatMessage(data) {
        this.addChatMessage(data.playerName, data.message, data.timestamp);
        if (data.playerId !== this.clientId) {
            this.playSound('notification');
        }
    }
    
    handleError(data) {
        console.error('❌ Ошибка от сервера:', data.message);
        this.addGameLog(data.message, 'error');
        this.hideLoading();
        this.playSound('error');
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
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('connectionStatusText');
        
        if (connected) {
            indicator.classList.add('connected');
            text.textContent = 'Подключено';
        } else {
            indicator.classList.remove('connected');
            text.textContent = 'Не подключено';
        }
    }
    
    updateServerStats(info) {
        document.getElementById('onlinePlayers').textContent = info.online || 0;
        document.getElementById('activeGames').textContent = info.games || 0;
    }
    
    updatePlayerDisplay() {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        document.getElementById('playerNameDisplay').textContent = this.playerName;
        const playerStatus = document.getElementById('playerStatus');
        playerStatus.className = 'status-badge connected';
        playerStatus.innerHTML = '<i class="fas fa-sign-in-alt"></i> В игре';
=======
=======
>>>>>>> Stashed changes
        const nameDisplay = document.getElementById('playerNameDisplay');
        const avatarImg = document.getElementById('playerAvatarImg');
        const statusBadge = document.getElementById('playerStatusBadge');
        
        if (nameDisplay) nameDisplay.textContent = this.playerName || 'Неизвестный игрок';
        if (avatarImg) avatarImg.src = GameConfig.getAvatarById(this.playerAvatar)?.image || 'https://i.imgur.com/6V9zLqW.png';
        if (statusBadge) statusBadge.textContent = this.gameState ? 'В игре' : 'Не в игре';
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    showNameModal() {
        document.getElementById('nameModal').classList.add('active');
        document.getElementById('nameInput').focus();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
        document.getElementById('nameInput').value = this.playerName || '';
        
        // Выделяем выбранный аватар
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === this.playerAvatar) {
                option.classList.add('selected');
            }
        });
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    hideNameModal() {
        document.getElementById('nameModal').classList.remove('active');
    }
    
    setupAvatarSelection() {
        const avatarsGrid = document.getElementById('avatarsGrid');
        
        GameConfig.avatars.forEach(avatar => {
            const option = document.createElement('div');
            option.className = `avatar-option ${avatar.id === this.playerAvatar ? 'selected' : ''}`;
            option.dataset.avatar = avatar.id;
            
            option.innerHTML = `
                <img src="${avatar.image}" alt="${avatar.name}">
                <div class="avatar-name">${avatar.name}</div>
                <div class="avatar-description">${avatar.description}</div>
            `;
            
            option.addEventListener('click', () => {
                avatarsGrid.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.playerAvatar = avatar.id;
            });
            
            avatarsGrid.appendChild(option);
        });
    }
    
    confirmName() {
        const nameInput = document.getElementById('nameInput');
        const name = nameInput.value.trim();
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        if (name) {
            this.sendToServer({
                type: 'set_name',
                name: name
            });
        } else {
            alert('Введите имя!');
            nameInput.focus();
=======
        if (name.length < 2) {
            this.showError('Имя должно содержать минимум 2 символа');
            return;
>>>>>>> Stashed changes
=======
        if (name.length < 2) {
            this.showError('Имя должно содержать минимум 2 символа');
            return;
>>>>>>> Stashed changes
        }
        
        if (name.length > 20) {
            this.showError('Имя не должно превышать 20 символов');
            return;
        }
        
        this.sendToServer({
            type: 'set_name',
            name: name,
            avatar: this.playerAvatar
        });
    }
    
    showError(message) {
        alert(message);
        this.playSound('error');
    }
    
    quickJoin() {
        if (!this.playerName) {
            this.showNameModal();
            return;
        }
        
        if (!this.isConnected) {
            this.showError('Нет соединения с сервером');
            return;
        }
        
        this.sendToServer({
            type: 'join_queue'
        });
    }
    
    findOpponent() {
        if (!this.playerName) {
            this.showNameModal();
            return;
        }
        
        this.addGameLog('Поиск противника по уровню...', 'info');
        this.quickJoin();
    }
    
    showSpectateModal() {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // В будущем можно добавить список активных игр
        alert('В текущей версии наблюдатели подключаются автоматически к новым играм');
=======
=======
>>>>>>> Stashed changes
        if (!this.isConnected) {
            this.showError('Нет соединения с сервером');
            return;
        }
        
        this.addGameLog('Наблюдение будет доступно в следующем обновлении', 'info');
    }
    
    showDeckBuilder() {
        if (!this.playerName) {
            this.showNameModal();
            return;
        }
        
        this.addGameLog('Редактор колоды будет доступен в следующем обновлении', 'info');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    showGameScreen() {
        document.getElementById('mainScreen').classList.remove('active-screen');
        document.getElementById('gameScreen').classList.add('active-screen');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        
        // Обновляем размеры при переходе
        setTimeout(() => this.handleResize(), 100);
=======
        this.handleResize();
        this.addGameLog('Добро пожаловать на поле боя!', 'success');
>>>>>>> Stashed changes
=======
        this.handleResize();
        this.addGameLog('Добро пожаловать на поле боя!', 'success');
>>>>>>> Stashed changes
    }
    
    showMainScreen() {
        document.getElementById('gameScreen').classList.remove('active-screen');
        document.getElementById('mainScreen').classList.add('active-screen');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        
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
=======
        this.resetGameState();
        this.updatePlayerDisplay();
>>>>>>> Stashed changes
=======
        this.resetGameState();
        this.updatePlayerDisplay();
>>>>>>> Stashed changes
    }
    
    updatePlayerView(isPlayer1) {
        if (!this.gameState) return;
        
        const player = isPlayer1 ? this.gameState.player1 : this.gameState.player2;
        const opponent = isPlayer1 ? this.gameState.player2 : this.gameState.player1;
        
        // Обновляем информацию игрока
        document.getElementById('playerNameGame').textContent = player.name;
        document.getElementById('playerAvatarImgGame').src = GameConfig.getAvatarById(player.avatar)?.image || 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('playerHealth').textContent = player.health;
        document.getElementById('playerMana').textContent = player.mana;
        document.getElementById('playerMaxMana').textContent = player.maxMana;
        document.getElementById('playerHandCount').textContent = player.hand?.length || 0;
        document.getElementById('playerDeckCount').textContent = player.deckSize || 30;
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Обновляем информацию о противнике
=======
        // Обновляем информацию противника
>>>>>>> Stashed changes
=======
        // Обновляем информацию противника
>>>>>>> Stashed changes
        document.getElementById('opponentName').textContent = opponent.name;
        document.getElementById('opponentAvatarImg').src = GameConfig.getAvatarById(opponent.avatar)?.image || 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('opponentHealth').textContent = opponent.health;
        document.getElementById('opponentMana').textContent = opponent.mana;
        document.getElementById('opponentMaxMana').textContent = opponent.maxMana;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        document.getElementById('opponentHealth').textContent = opponent.health;
        document.getElementById('opponentHandCount').textContent = opponent.hand?.length || 0;
        
        // Рендерим руку и поле игрока
        this.renderHand('playerHand', player.hand || [], true);
        this.renderBoard('playerBoard', player.board || [], true);
        
        // Рука противника скрыта
        this.renderHiddenHand('opponentHand', opponent.hand?.length || 0);
        this.renderBoard('opponentBoard', opponent.board || [], false);
=======
        document.getElementById('opponentHandCount').textContent = opponent.handSize || 0;
        
        // Обновляем счетчик артефактов
        document.getElementById('artifactDeckCount').textContent = this.gameState.artifactDeckSize || 0;
        
        // Рендерим руку
        this.renderHand('playerHand', player.hand || []);
        
=======
        document.getElementById('opponentHandCount').textContent = opponent.handSize || 0;
        
        // Обновляем счетчик артефактов
        document.getElementById('artifactDeckCount').textContent = this.gameState.artifactDeckSize || 0;
        
        // Рендерим руку
        this.renderHand('playerHand', player.hand || []);
        
>>>>>>> Stashed changes
        // Рендерим поля
        this.renderBoard('playerBoardGrid', player.board || [], true);
        this.renderBoard('opponentBoardGrid', opponent.board || [], false);
        
        // Рендерим артефакты
        this.renderArtifacts('artifactContainer', player.artifacts || []);
>>>>>>> Stashed changes
        
        // Обновляем квест
        this.updateQuestInfo(player.quest);
        
        // Обновляем квест
        this.updateQuestInfo(player.quest);
        
        // Обновляем статус хода
        const isMyTurn = this.gameState.currentTurn === player.id;
        this.updateTurnIndicator(isMyTurn);
        this.updateControls(isMyTurn);
    }
    
    updateSpectatorView() {
        if (!this.gameState) return;
        
        const player1 = this.gameState.player1;
        const player2 = this.gameState.player2;
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
        // Обновляем информацию для наблюдателя
        document.getElementById('playerNameGame').textContent = 'Наблюдатель';
        document.getElementById('playerAvatarImgGame').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('playerHealth').textContent = '∞';
        document.getElementById('playerMana').textContent = '∞';
        document.getElementById('playerMaxMana').textContent = '∞';
        
        document.getElementById('opponentName').textContent = `${player1.name} vs ${player2.name}`;
        document.getElementById('opponentAvatarImg').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('opponentHealth').textContent = '∞';
        
        // Рука пустая для наблюдателя
        this.renderHand('playerHand', []);
        
        // Поля только для просмотра
        this.renderBoard('playerBoardGrid', player1.board || [], false);
        this.renderBoard('opponentBoardGrid', player2.board || [], false);
        
        // Отключаем кнопки управления
        this.updateControls(false);
        
        this.addGameLog('Вы наблюдаете за игрой', 'info');
>>>>>>> Stashed changes
=======
        // Обновляем информацию для наблюдателя
        document.getElementById('playerNameGame').textContent = 'Наблюдатель';
        document.getElementById('playerAvatarImgGame').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('playerHealth').textContent = '∞';
        document.getElementById('playerMana').textContent = '∞';
        document.getElementById('playerMaxMana').textContent = '∞';
        
        document.getElementById('opponentName').textContent = `${player1.name} vs ${player2.name}`;
        document.getElementById('opponentAvatarImg').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('opponentHealth').textContent = '∞';
        
        // Рука пустая для наблюдателя
        this.renderHand('playerHand', []);
        
        // Поля только для просмотра
        this.renderBoard('playerBoardGrid', player1.board || [], false);
        this.renderBoard('opponentBoardGrid', player2.board || [], false);
        
        // Отключаем кнопки управления
        this.updateControls(false);
        
        this.addGameLog('Вы наблюдаете за игрой', 'info');
>>>>>>> Stashed changes
    }
    
    renderHand(containerId, hand, isOwnHand) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!hand || hand.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-hand';
            empty.innerHTML = `
                <i class="fas fa-hand-scissors"></i>
                <span>${this.isSpectator ? 'Наблюдение' : 'Рука пуста'}</span>
            `;
            container.appendChild(empty);
            return;
        }
        
        hand.forEach((card, index) => {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            const cardElement = this.createCardElement(card, isOwnHand ? 'hand' : 'opponent-hand');
            container.appendChild(cardElement);
            
            if (isOwnHand) {
                // Добавляем обработчик выбора карты
                cardElement.addEventListener('click', () => this.selectCard(card));
            }
        });
=======
            const cardElement = this.createCardElement(card, 'hand');
            cardElement.style.transform = `translateX(${index * 10}px)`;
            cardElement.style.zIndex = index;
            
            cardElement.addEventListener('mouseenter', () => {
                this.handleCardHover(cardElement, true);
            });
            
            cardElement.addEventListener('mouseleave', () => {
                this.handleCardHover(cardElement, false);
            });
            
=======
            const cardElement = this.createCardElement(card, 'hand');
            cardElement.style.transform = `translateX(${index * 10}px)`;
            cardElement.style.zIndex = index;
            
            cardElement.addEventListener('mouseenter', () => {
                this.handleCardHover(cardElement, true);
            });
            
            cardElement.addEventListener('mouseleave', () => {
                this.handleCardHover(cardElement, false);
            });
            
>>>>>>> Stashed changes
            cardElement.addEventListener('click', () => {
                this.selectCard(card);
            });
            
            container.appendChild(cardElement);
        });
        
        // Анимация появления карт
        container.querySelectorAll('.card-in-hand').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = `translateX(${index * 10}px) translateY(0)`;
            }, index * 50);
        });
    }
    
    handleCardHover(cardElement, isHovering) {
        if (isHovering) {
            // Увеличиваем карту в 2.5 раза
            cardElement.style.transform = 'translateY(-60px) scale(2.5)';
            cardElement.style.zIndex = '2000';
            cardElement.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(37, 99, 235, 0.7)';
        } else if (!cardElement.classList.contains('selected')) {
            // Возвращаем в исходное состояние
            const cards = document.querySelectorAll('.card-in-hand');
            const index = Array.from(cards).indexOf(cardElement);
            cardElement.style.transform = `translateX(${index * 10}px) translateY(0) scale(1)`;
            cardElement.style.zIndex = index;
            cardElement.style.boxShadow = 'var(--shadow-lg)';
        }
    }
    
    selectCard(card) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
        
        const wasSelected = this.selectedCard?.instanceId === card.instanceId;
        this.clearSelections();
        
        if (!wasSelected) {
            this.selectedCard = card;
            
            // Подсвечиваем карту
            document.querySelectorAll('.card-in-hand').forEach(el => {
                el.classList.remove('selected');
                const cards = document.querySelectorAll('.card-in-hand');
                const index = Array.from(cards).indexOf(el);
                if (!el.classList.contains('selected')) {
                    el.style.transform = `translateX(${index * 10}px) translateY(0) scale(1)`;
                    el.style.zIndex = index;
                    el.style.boxShadow = 'var(--shadow-lg)';
                }
            });
            
            const cardElement = document.querySelector(`[data-id="${card.instanceId}"]`);
            if (cardElement) {
                cardElement.classList.add('selected');
                cardElement.style.transform = 'translateY(-40px) scale(1.3)';
                cardElement.style.zIndex = '1000';
                cardElement.style.boxShadow = 'var(--shadow-xl), 0 0 30px rgba(245, 158, 11, 0.7)';
                this.addGameLog(`Выбрана карта: ${card.name}`, 'info');
            }
            
            this.updateControls(true);
            this.playSound('select');
        }
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    renderBoard(containerId, board, isOwnBoard) {
        const container = document.getElementById(containerId);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!board || board.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-board';
            emptyMsg.innerHTML = '<i class="fas fa-chess-board"></i><span>Поле пусто</span>';
            container.appendChild(emptyMsg);
            return;
        }
=======
>>>>>>> Stashed changes
        
        board.forEach((creature, index) => {
            const cardElement = this.createCardElement(creature, 'board');
            container.appendChild(cardElement);
            
            if (isOwnBoard && creature.canAttack && !creature.hasAttacked) {
                // Добавляем возможность атаки
                cardElement.classList.add('can-attack');
                cardElement.addEventListener('click', () => this.selectAttacker(creature));
=======
        
        // Очищаем ячейки
        container.querySelectorAll('.board-cell').forEach((cell, index) => {
            cell.innerHTML = `<span class="cell-number">${index + 1}</span>`;
            cell.classList.remove('occupied', 'highlighted');
            
            if (cell.classList.contains('special-cell')) {
                const tooltip = index === 0 ? 
                    'Ячейка 1: Немедленная атака' : 
                    'Ячейка 5: Скрытность';
                cell.title = tooltip;
            }
        });
        
        // Заполняем существами
        board.forEach((creature, index) => {
            if (creature) {
                const cell = container.querySelector(`[data-cell="${index}"]`);
                if (cell) {
                    cell.classList.add('occupied');
                    
                    const creatureElement = this.createCreatureElement(creature, isOwnBoard);
                    cell.appendChild(creatureElement);
                    
                    // Для своих существ добавляем возможность атаки
                    if (isOwnBoard && creature.canAttack && !creature.hasAttacked && !this.isSpectator) {
                        creatureElement.classList.add('attackable');
                        creatureElement.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.selectAttacker(creature);
                        });
                    }
                }
>>>>>>> Stashed changes
            }
        });
    }
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
    
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    createCardElement(cardData, location) {
        const card = document.createElement('div');
        card.className = `card-in-hand ${this.selectedCard?.instanceId === cardData.instanceId ? 'selected' : ''}`;
        card.dataset.id = cardData.instanceId;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        
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
=======
        card.dataset.type = cardData.type;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        let statsHTML = '';
        if (cardData.type === 'creature') {
            statsHTML = `
                <div class="card-stats">
=======
        card.dataset.type = cardData.type;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        let statsHTML = '';
        if (cardData.type === 'creature') {
            statsHTML = `
                <div class="card-stats">
>>>>>>> Stashed changes
                    <div class="card-stat attack">${cardData.attack}</div>
                    <div class="card-stat health">${cardData.health}</div>
                </div>
            `;
        } else if (cardData.type === 'spell') {
            statsHTML = `
                <div class="card-stats">
                    <div class="card-stat effect">⚡${cardData.value || 0}</div>
                </div>
            `;
        }
        
        // Определяем цвет границы по редкости
        const rarityColor = GameConfig.getRarityColor(cardData.rarity);
        
        card.innerHTML = `
            <div class="card-header" style="border-bottom-color: ${rarityColor}40">
                <div class="card-cost" style="background: ${rarityColor}">${cardData.cost}</div>
                <div class="card-name">${cardData.name}</div>
            </div>
            <div class="card-image">
                <div class="card-image-placeholder" style="background: ${rarityColor}20">
                    <i class="fas fa-${cardData.type === 'creature' ? 'dragon' : 'bolt'}"></i>
                </div>
            </div>
            ${statsHTML}
        `;
        
        // Добавляем реальное изображение, если есть
        if (cardData.image) {
            const img = new Image();
            img.src = cardData.image;
            img.onload = () => {
                const placeholder = card.querySelector('.card-image-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '';
                    placeholder.appendChild(img);
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '6px';
                }
            };
        }
        
        return card;
    }
    
    createCreatureElement(creature, isOwn) {
        const element = document.createElement('div');
        element.className = 'creature-card';
        element.dataset.id = creature.instanceId;
        element.title = creature.name;
        
        const attack = creature.attack + (creature.bonuses?.attack || 0);
        const health = creature.currentHealth || creature.health;
        const maxHealth = creature.maxHealth || creature.health;
        
        let statusHTML = '';
        if (creature.canAttack && !creature.hasAttacked) {
            statusHTML = `
                <div class="creature-status">
                    <div class="status-icon can-attack" title="Может атаковать">
                        <i class="fas fa-bolt"></i>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                    </div>
                </div>
            `;
        }
        
        if (creature.stealth) {
            statusHTML += `
                <div class="creature-status">
                    <div class="status-icon stealth" title="Скрытность">
                        <i class="fas fa-eye-slash"></i>
                    </div>
                </div>
            `;
        }
        
        if (creature.frozen) {
            statusHTML += `
                <div class="creature-status">
                    <div class="status-icon frozen" title="Заморожен">
                        <i class="fas fa-snowflake"></i>
                    </div>
                </div>
            `;
        }
        
        element.innerHTML = `
            <div class="creature-header">
                <div class="creature-name">${creature.name}</div>
                <div class="creature-cost">${creature.cost}</div>
            </div>
            <div class="creature-image">
                <div class="creature-image-placeholder">
                    <i class="fas fa-dragon"></i>
                </div>
            </div>
            <div class="creature-stats">
                <div class="creature-stat attack">${attack}</div>
                <div class="creature-stat health">${health}</div>
            </div>
            ${statusHTML}
        `;
        
        // Добавляем реальное изображение, если есть
        if (creature.image) {
            const img = new Image();
            img.src = creature.image;
            img.onload = () => {
                const placeholder = element.querySelector('.creature-image-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '';
                    placeholder.appendChild(img);
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '4px';
                }
            };
        }
<<<<<<< Updated upstream
        
        return element;
    }
    
<<<<<<< Updated upstream
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
=======
    renderArtifacts(containerId, artifacts) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!artifacts || artifacts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-artifacts';
            empty.textContent = 'Артефактов нет';
            container.appendChild(empty);
            return;
        }
        
=======
        
        return element;
    }
    
    renderArtifacts(containerId, artifacts) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!artifacts || artifacts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-artifacts';
            empty.textContent = 'Артефактов нет';
            container.appendChild(empty);
            return;
        }
        
>>>>>>> Stashed changes
        artifacts.forEach(artifact => {
            const element = document.createElement('div');
            element.className = `artifact-item ${this.selectedArtifact?.instanceId === artifact.instanceId ? 'selected' : ''}`;
            element.dataset.id = artifact.instanceId;
            
            element.innerHTML = `
                <div class="artifact-icon">
                    <i class="fas fa-${artifact.effect === 'attack_buff' ? 'sword' : 
                                      artifact.effect === 'health_buff' ? 'heart' : 
                                      artifact.effect === 'spell_power' ? 'magic' : 
                                      'gem'}"></i>
                </div>
                <div class="artifact-info">
                    <div class="artifact-name">${artifact.name}</div>
                    <div class="artifact-description">${artifact.description}</div>
                </div>
            `;
            
            element.addEventListener('click', () => {
                if (!this.isSpectator) {
                    this.selectArtifact(artifact);
                }
            });
            
            container.appendChild(element);
        });
    }
    
    selectArtifact(artifact) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
        
        this.clearSelections();
        this.selectedArtifact = artifact;
        
        // Подсвечиваем артефакт
        document.querySelectorAll('.artifact-item').forEach(el => {
            el.classList.remove('selected');
        });
        const artifactElement = document.querySelector(`[data-id="${artifact.instanceId}"]`);
        if (artifactElement) {
            artifactElement.classList.add('selected');
            this.addGameLog(`Выбран артефакт: ${artifact.name}`, 'info');
        }
        
        this.updateControls(true);
        this.playSound('select');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    selectAttacker(creature) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
<<<<<<< Updated upstream
        const player = this.getPlayer();
        if (this.gameState.currentTurn !== player.id) return;
=======
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
>>>>>>> Stashed changes
        
        if (!creature.canAttack || creature.hasAttacked) {
            this.addGameLog('Это существо не может атаковать', 'error');
            this.playSound('error');
            return;
        }
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
        this.selectedAttacker = creature;
        this.targetMode = 'attack';
        
        // Подсвечиваем доступные цели
        this.highlightAttackTargets(creature);
        
        this.addGameLog('Выберите цель для атаки', 'info');
        this.playSound('select');
    }
    
    highlightAttackTargets(attacker) {
        if (!this.gameState) return;
        
        const opponent = this.gameState.opponent;
        
        // Снимаем предыдущие выделения
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Подсвечиваем существа противника
        opponent.board.forEach((creature, cell) => {
            if (creature) {
                // Проверяем скрытность
                if (creature.stealth && !creature.hasAttacked) {
                    return;
                }
                
                const cellElement = document.querySelector(`#opponentBoardGrid [data-cell="${cell}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlighted');
                    cellElement.addEventListener('click', () => {
                        this.executeAttack(attacker.instanceId, cell.toString());
                    }, { once: true });
                }
            }
        });
    }
    
    handleCellClick(cell) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const cellIndex = parseInt(cell.dataset.cell);
        
        if (this.targetMode === 'play' && this.selectedCard) {
            this.playCardToCell(cellIndex);
        } else if (this.targetMode === 'artifact' && this.selectedArtifact) {
            this.useArtifactOnCell(cellIndex);
        }
    }
    
    playCardToCell(cellIndex) {
        if (!this.selectedCard) return;
        
        const player = this.gameState.player;
        
        // Проверяем, свободна ли ячейка
        if (player.board[cellIndex]) {
            this.addGameLog('Ячейка уже занята', 'error');
            this.playSound('error');
            return;
        }
        
        // Проверяем хватает ли маны
        if (player.mana < this.selectedCard.cost) {
            this.addGameLog('Недостаточно маны', 'error');
            this.playSound('error');
            return;
        }
        
        this.sendToServer({
            type: 'play_card',
            cardId: this.selectedCard.instanceId,
            cell: cellIndex
        });
        
        this.clearSelections();
    }
    
=======
        this.selectedAttacker = creature;
        this.targetMode = 'attack';
        
        // Подсвечиваем доступные цели
        this.highlightAttackTargets(creature);
        
        this.addGameLog('Выберите цель для атаки', 'info');
        this.playSound('select');
    }
    
    highlightAttackTargets(attacker) {
        if (!this.gameState) return;
        
        const opponent = this.gameState.opponent;
        
        // Снимаем предыдущие выделения
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Подсвечиваем существа противника
        opponent.board.forEach((creature, cell) => {
            if (creature) {
                // Проверяем скрытность
                if (creature.stealth && !creature.hasAttacked) {
                    return;
                }
                
                const cellElement = document.querySelector(`#opponentBoardGrid [data-cell="${cell}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlighted');
                    cellElement.addEventListener('click', () => {
                        this.executeAttack(attacker.instanceId, cell.toString());
                    }, { once: true });
                }
            }
        });
    }
    
    handleCellClick(cell) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const cellIndex = parseInt(cell.dataset.cell);
        
        if (this.targetMode === 'play' && this.selectedCard) {
            this.playCardToCell(cellIndex);
        } else if (this.targetMode === 'artifact' && this.selectedArtifact) {
            this.useArtifactOnCell(cellIndex);
        }
    }
    
    playCardToCell(cellIndex) {
        if (!this.selectedCard) return;
        
        const player = this.gameState.player;
        
        // Проверяем, свободна ли ячейка
        if (player.board[cellIndex]) {
            this.addGameLog('Ячейка уже занята', 'error');
            this.playSound('error');
            return;
        }
        
        // Проверяем хватает ли маны
        if (player.mana < this.selectedCard.cost) {
            this.addGameLog('Недостаточно маны', 'error');
            this.playSound('error');
            return;
        }
        
        this.sendToServer({
            type: 'play_card',
            cardId: this.selectedCard.instanceId,
            cell: cellIndex
        });
        
        this.clearSelections();
    }
    
>>>>>>> Stashed changes
    useArtifactOnCell(cellIndex) {
        if (!this.selectedArtifact) return;
        
        this.sendToServer({
            type: 'use_artifact',
            artifactId: this.selectedArtifact.instanceId,
            targetId: cellIndex.toString()
        });
        
        this.clearSelections();
    }
    
    playSelectedCard() {
        if (!this.selectedCard) {
            this.addGameLog('Выберите карту для розыгрыша', 'error');
            this.playSound('error');
            return;
        }
        
        if (this.selectedCard.type === 'creature') {
            // Для существ нужно выбрать ячейку
            this.targetMode = 'play';
            this.highlightAvailableCells();
            this.addGameLog('Выберите ячейку для существа', 'info');
        } else {
            // Для заклинаний используем на героя
            this.sendToServer({
                type: 'play_card',
                cardId: this.selectedCard.instanceId,
                cell: 'hero'
            });
            this.clearSelections();
        }
    }
    
    highlightAvailableCells() {
        if (!this.gameState) return;
        
        const player = this.gameState.player;
        
        // Снимаем предыдущие выделения
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Подсвечиваем свободные ячейки
        for (let i = 0; i < player.board.length; i++) {
            if (!player.board[i]) {
                const cellElement = document.querySelector(`#playerBoardGrid [data-cell="${i}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlighted');
                    cellElement.addEventListener('click', () => {
                        this.playCardToCell(i);
                    }, { once: true });
                }
            }
        }
    }
    
    initiateAttack() {
        if (this.targetMode === 'attack') {
            this.cancelTargetMode();
        } else {
            this.addGameLog('Выберите существо для атаки', 'info');
        }
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
        
        // Проверяем, есть ли существа для атаки
        const hasAttackers = player.board.some(creature => 
            creature && creature.canAttack && !creature.hasAttacked
        );
        
        if (!hasAttackers) {
            this.addGameLog('Нет существ для авто-атаки', 'error');
            this.playSound('error');
            return;
        }
        
        this.sendToServer({
            type: 'auto_attack'
        });
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
    }
    
    useSelectedArtifact() {
        if (!this.selectedArtifact) {
            this.addGameLog('Выберите артефакт', 'error');
            this.playSound('error');
            return;
        }
        
        this.targetMode = 'artifact';
        this.addGameLog('Выберите цель для артефакта', 'info');
        
        // Подсвечиваем доступные цели
        this.highlightArtifactTargets();
    }
    
    highlightArtifactTargets() {
        if (!this.gameState) return;
        
        const player = this.gameState.player;
        
        // Снимаем предыдущие выделения
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Подсвечиваем своих существ
        player.board.forEach((creature, cell) => {
            if (creature) {
                const cellElement = document.querySelector(`#playerBoardGrid [data-cell="${cell}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlighted');
                    cellElement.addEventListener('click', () => {
                        this.useArtifactOnCell(cell);
                    }, { once: true });
                }
            }
        });
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
    
    endTurn() {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
        
        this.sendToServer({
            type: 'end_turn'
        });
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
        this.clearSelections();
    }
    
    clearSelections() {
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        
        // Снимаем выделение
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Возвращаем все карты в исходное состояние
        const cards = document.querySelectorAll('.card-in-hand');
        cards.forEach((card, index) => {
            card.style.transform = `translateX(${index * 10}px) translateY(0) scale(1)`;
            card.style.zIndex = index;
            card.style.boxShadow = 'var(--shadow-lg)';
        });
        
        this.updateControls(this.isPlayer && this.gameState?.currentTurn === this.clientId);
    }
    
    cancelTargetMode() {
        this.clearSelections();
        this.addGameLog('Режим выбора цели отменен', 'info');
    }
    
    updateGameBoard() {
        if (!this.gameState) return;
        
        const currentPlayerId = this.gameState.currentTurn;
        const currentPlayer = currentPlayerId === this.gameState.player?.id ? 
                             this.gameState.player : this.gameState.opponent;
        
        // Обновляем индикатор хода
        document.getElementById('currentTurnPlayer').textContent = currentPlayer.name;
        
        // Обновляем номер хода
        document.getElementById('turnNumber').textContent = this.gameState.turnNumber || 1;
        
        // Обновляем таймер
        if (this.gameState.turnEndTime) {
            const turnEndTime = new Date(this.gameState.turnEndTime).getTime();
            const now = Date.now();
            this.timeLeft = Math.max(0, Math.floor((turnEndTime - now) / 1000));
            this.updateGameInfo();
        }
    }
    
    updateGameInfo() {
        const timerDisplay = document.getElementById('gameTimer');
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timeLeft);
            
            // Меняем цвет при малом времени
            if (this.timeLeft <= 30) {
                timerDisplay.style.color = 'var(--accent-red)';
            } else if (this.timeLeft <= 60) {
                timerDisplay.style.color = 'var(--accent-yellow)';
            } else {
                timerDisplay.style.color = 'var(--accent-red)';
            }
        }
    }
    
    updateQuestInfo(quest) {
        if (!quest) return;
        
        const questText = document.getElementById('currentQuest');
        const progressFill = document.getElementById('questProgressFill');
        const progressText = document.getElementById('questProgressText');
        
        if (questText) questText.textContent = quest.description || 'Выполните условие';
        if (progressFill && progressText) {
            const progress = Math.min(quest.progress || 0, quest.requirement || 1);
            const percent = (progress / (quest.requirement || 1)) * 100;
            
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${progress}/${quest.requirement || 1}`;
        }
    }
    
    updateTurnIndicator(isMyTurn) {
        if (!this.isPlayer) return;
        
        const statusElement = document.getElementById('playerStatusGame');
        if (statusElement) {
            if (isMyTurn) {
                statusElement.textContent = 'Ваш ход!';
                statusElement.style.color = 'var(--accent-green)';
            } else {
                statusElement.textContent = 'Ход противника';
                statusElement.style.color = 'var(--text-secondary)';
            }
        }
>>>>>>> Stashed changes
    }
    
    updateControls(isMyTurn) {
        if (!this.isPlayer || this.isSpectator) {
            // Для наблюдателей все кнопки неактивны
            ['attackBtn', 'playCardBtn', 'autoAttackBtn', 'useArtifactBtn', 'endTurnBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.disabled = true;
                }
            });
            return;
        }
        
        const isActive = isMyTurn && this.gameState?.status === 'active';
        
        // Обновляем состояние кнопок
        const attackBtn = document.getElementById('attackBtn');
        const playCardBtn = document.getElementById('playCardBtn');
        const autoAttackBtn = document.getElementById('autoAttackBtn');
        const useArtifactBtn = document.getElementById('useArtifactBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        if (attackBtn) {
            attackBtn.disabled = !isActive || !this.selectedAttacker;
        }
        
        if (playCardBtn) {
            playCardBtn.disabled = !isActive || !this.selectedCard;
        }
        
        if (autoAttackBtn) {
            autoAttackBtn.disabled = !isActive;
        }
        
        if (useArtifactBtn) {
            useArtifactBtn.disabled = !isActive || !this.selectedArtifact;
        }
        
        if (endTurnBtn) {
            endTurnBtn.disabled = !isActive;
        }
    }
    
    startTurnTimer() {
        this.stopTurnTimer();
        
=======
        this.clearSelections();
    }
    
    clearSelections() {
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        
        // Снимаем выделение
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Возвращаем все карты в исходное состояние
        const cards = document.querySelectorAll('.card-in-hand');
        cards.forEach((card, index) => {
            card.style.transform = `translateX(${index * 10}px) translateY(0) scale(1)`;
            card.style.zIndex = index;
            card.style.boxShadow = 'var(--shadow-lg)';
        });
        
        this.updateControls(this.isPlayer && this.gameState?.currentTurn === this.clientId);
    }
    
    cancelTargetMode() {
        this.clearSelections();
        this.addGameLog('Режим выбора цели отменен', 'info');
    }
    
    updateGameBoard() {
        if (!this.gameState) return;
        
        const currentPlayerId = this.gameState.currentTurn;
        const currentPlayer = currentPlayerId === this.gameState.player?.id ? 
                             this.gameState.player : this.gameState.opponent;
        
        // Обновляем индикатор хода
        document.getElementById('currentTurnPlayer').textContent = currentPlayer.name;
        
        // Обновляем номер хода
        document.getElementById('turnNumber').textContent = this.gameState.turnNumber || 1;
        
        // Обновляем таймер
        if (this.gameState.turnEndTime) {
            const turnEndTime = new Date(this.gameState.turnEndTime).getTime();
            const now = Date.now();
            this.timeLeft = Math.max(0, Math.floor((turnEndTime - now) / 1000));
            this.updateGameInfo();
        }
    }
    
    updateGameInfo() {
        const timerDisplay = document.getElementById('gameTimer');
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timeLeft);
            
            // Меняем цвет при малом времени
            if (this.timeLeft <= 30) {
                timerDisplay.style.color = 'var(--accent-red)';
            } else if (this.timeLeft <= 60) {
                timerDisplay.style.color = 'var(--accent-yellow)';
            } else {
                timerDisplay.style.color = 'var(--accent-red)';
            }
        }
    }
    
    updateQuestInfo(quest) {
        if (!quest) return;
        
        const questText = document.getElementById('currentQuest');
        const progressFill = document.getElementById('questProgressFill');
        const progressText = document.getElementById('questProgressText');
        
        if (questText) questText.textContent = quest.description || 'Выполните условие';
        if (progressFill && progressText) {
            const progress = Math.min(quest.progress || 0, quest.requirement || 1);
            const percent = (progress / (quest.requirement || 1)) * 100;
            
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${progress}/${quest.requirement || 1}`;
        }
    }
    
    updateTurnIndicator(isMyTurn) {
        if (!this.isPlayer) return;
        
        const statusElement = document.getElementById('playerStatusGame');
        if (statusElement) {
            if (isMyTurn) {
                statusElement.textContent = 'Ваш ход!';
                statusElement.style.color = 'var(--accent-green)';
            } else {
                statusElement.textContent = 'Ход противника';
                statusElement.style.color = 'var(--text-secondary)';
            }
        }
    }
    
    updateControls(isMyTurn) {
        if (!this.isPlayer || this.isSpectator) {
            // Для наблюдателей все кнопки неактивны
            ['attackBtn', 'playCardBtn', 'autoAttackBtn', 'useArtifactBtn', 'endTurnBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.disabled = true;
                }
            });
            return;
        }
        
        const isActive = isMyTurn && this.gameState?.status === 'active';
        
        // Обновляем состояние кнопок
        const attackBtn = document.getElementById('attackBtn');
        const playCardBtn = document.getElementById('playCardBtn');
        const autoAttackBtn = document.getElementById('autoAttackBtn');
        const useArtifactBtn = document.getElementById('useArtifactBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        if (attackBtn) {
            attackBtn.disabled = !isActive || !this.selectedAttacker;
        }
        
        if (playCardBtn) {
            playCardBtn.disabled = !isActive || !this.selectedCard;
        }
        
        if (autoAttackBtn) {
            autoAttackBtn.disabled = !isActive;
        }
        
        if (useArtifactBtn) {
            useArtifactBtn.disabled = !isActive || !this.selectedArtifact;
        }
        
        if (endTurnBtn) {
            endTurnBtn.disabled = !isActive;
        }
    }
    
    startTurnTimer() {
        this.stopTurnTimer();
        
>>>>>>> Stashed changes
        this.updateGameInfo();
        
        this.turnTimer = setInterval(() => {
            this.timeLeft--;
            this.updateGameInfo();
            
            if (this.timeLeft <= 0) {
                this.stopTurnTimer();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                // Автоматически завершаем ход
                if (this.isPlayer && this.gameState.currentTurn === this.getPlayerId()) {
=======
                if (this.isPlayer && this.gameState?.currentTurn === this.clientId) {
                    this.addGameLog('Время хода истекло!', 'error');
>>>>>>> Stashed changes
=======
                if (this.isPlayer && this.gameState?.currentTurn === this.clientId) {
                    this.addGameLog('Время хода истекло!', 'error');
>>>>>>> Stashed changes
                    this.endTurn();
                }
            }
            
            // Звуковое предупреждение
            if (this.timeLeft === 10) {
                this.playSound('warning');
            }
        }, 1000);
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
    
    addGameLog(message, type = 'info') {
        const container = document.getElementById('gameLog');
        if (!container) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        container.appendChild(logEntry);
        container.scrollTop = container.scrollHeight;
        
        // Ограничиваем количество записей
        const entries = container.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }
    
    addChatMessage(sender, message, timestamp) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                 new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${this.escapeHtml(sender)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
        
        // Ограничиваем количество сообщений
        const messages = container.querySelectorAll('.chat-message');
        if (messages.length > 100) {
            messages[0].remove();
        }
    }
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (message.length > 200) {
            this.addGameLog('Сообщение слишком длинное (макс. 200 символов)', 'error');
            return;
        }
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        container.appendChild(logEntry);
        container.scrollTop = container.scrollHeight;
        
        // Ограничиваем количество записей
        const entries = container.querySelectorAll('.log-entry');
        if (entries.length > GameConfig.ui.maxLogEntries) {
            entries[0].remove();
=======
=======
>>>>>>> Stashed changes
        if (this.sendToServer({
            type: 'chat_message',
            message: message
        })) {
            input.value = '';
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        }
    }
    
    toggleSidePanel() {
        const panel = document.getElementById('sidePanel');
        const toggle = document.getElementById('panelToggle');
<<<<<<< Updated upstream
        
        this.sidePanelOpen = !this.sidePanelOpen;
        panel.classList.toggle('active', this.sidePanelOpen);
        
        // Меняем иконку
        if (this.sidePanelOpen) {
            toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            toggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    }
    
    switchTab(tab) {
        // Обновляем активные вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
=======
        
        this.sidePanelOpen = !this.sidePanelOpen;
        panel.classList.toggle('active', this.sidePanelOpen);
        
        // Меняем иконку
        if (this.sidePanelOpen) {
            toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            toggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    }
    
    switchTab(tab) {
        // Обновляем активные вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
>>>>>>> Stashed changes
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });
    }
    
    returnToMain() {
        if (this.currentGameId && this.isPlayer) {
            if (confirm('Вы уверены? Это засчитается как поражение.')) {
                this.sendToServer({
                    type: 'surrender'
                });
            }
        }
        
        this.showMainScreen();
        this.playSound('menu');
    }
    
    resetGameState() {
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        this.clearSelections();
        this.stopTurnTimer();
        this.timeLeft = 120;
        
        // Закрываем боковую панель
        this.sidePanelOpen = false;
        document.getElementById('sidePanel').classList.remove('active');
        document.getElementById('panelToggle').innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        // Очищаем игровые элементы
        const elementsToClear = [
            'playerHand', 'playerBoardGrid', 'opponentBoardGrid', 
            'gameLog', 'chatMessages', 'artifactContainer'
        ];
        
        elementsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });
        
        // Сбрасываем UI
        document.getElementById('currentQuest').textContent = 'Выполните условие';
        document.getElementById('questProgressFill').style.width = '0%';
        document.getElementById('questProgressText').textContent = '0/0';
        document.getElementById('currentTurnPlayer').textContent = 'Ожидание...';
        document.getElementById('gameTimer').textContent = '02:00';
        
        // Сбрасываем статус игрока
        this.updatePlayerDisplay();
        
        this.addGameLog('Возврат в главное меню', 'info');
    }
    
    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        
        const particleCount = 20;
        const colors = ['#2563eb', '#7c3aed', '#06b6d4', '#f59e0b', '#10b981'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 1;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = 15 + Math.random() * 15;
            const delay = Math.random() * 20;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
            
            container.appendChild(particle);
        }
    }
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
    showArtifactInfo() {
        if (this.gameState) {
            const count = this.gameState.artifactDeckSize || 0;
            this.addGameLog(`Колода артефактов: ${count} карт${count > 0 ? '' : ' (пуста)'}`, 'info');
        }
    }
    
    showDeckInfo() {
        if (this.gameState) {
            const player = this.gameState.player;
            const count = player?.deckSize || 0;
            this.addGameLog(`Ваша колода: ${count} карт${count > 0 ? '' : ' (пуста)'}`, 'info');
        }
    }
    
    playSound(soundName) {
        // Базовая реализация звуков
        console.log(`🔊 Воспроизведение звука: ${soundName}`);
        
        // Можно добавить вибрацию для мобильных устройств
        if (navigator.vibrate && soundName === 'attack') {
            navigator.vibrate(50);
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        
        // Обновляем CSS переменные для адаптивности
        if (isMobile) {
            document.documentElement.style.setProperty('--card-width', '120px');
            document.documentElement.style.setProperty('--card-height', '180px');
            document.documentElement.style.setProperty('--cell-width', '100px');
            document.documentElement.style.setProperty('--cell-height', '140px');
        } else if (isTablet) {
            document.documentElement.style.setProperty('--card-width', '140px');
            document.documentElement.style.setProperty('--card-height', '200px');
            document.documentElement.style.setProperty('--cell-width', '120px');
            document.documentElement.style.setProperty('--cell-height', '160px');
        } else {
            document.documentElement.style.setProperty('--card-width', '160px');
            document.documentElement.style.setProperty('--card-height', '220px');
            document.documentElement.style.setProperty('--cell-width', '140px');
            document.documentElement.style.setProperty('--cell-height', '180px');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    cleanup() {
        // Отправляем сообщение о выходе
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendToServer({
                type: 'leave_queue'
            });
            
            if (this.currentGameId && this.isPlayer) {
                this.sendToServer({
                    type: 'surrender'
                });
            }
            
            this.ws.close();
        }
        
        this.stopTurnTimer();
        console.log('🧹 Клиент очищен');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    console.log('🎮 Инициализация BattleScript клиента...');
    window.gameClient = new BattleScriptClient();
=======
    console.log('🎮 BattleScript Pro - Улучшенный интерфейс инициализирован');
>>>>>>> Stashed changes
=======
    console.log('🎮 BattleScript Pro - Улучшенный интерфейс инициализирован');
>>>>>>> Stashed changes
    
    // Проверка WebSocket поддержки
    if (!window.WebSocket) {
        alert('Ваш браузер не поддерживает WebSocket. Пожалуйста, используйте современный браузер.');
        return;
    }
    
    // Инициализация клиента
    window.gameClient = new BattleScriptProClient();
    
    // Глобальные хоткеи
    document.addEventListener('keydown', (e) => {
        // Пропускаем хоткеи в полях ввода
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key.toLowerCase()) {
            case 'escape':
                if (document.querySelector('.modal-overlay.active')) {
                    document.querySelector('.modal-overlay.active .modal-close')?.click();
                }
                break;
                
            case 'enter':
                if (window.gameClient?.gameState && window.gameClient.isPlayer) {
                    window.gameClient.endTurn();
                }
                break;
                
            case ' ':
                if (window.gameClient?.gameState && window.gameClient.isPlayer) {
                    window.gameClient.autoAttack();
                    e.preventDefault();
                }
                break;
        }
    });
    
    console.log('%c⚔️ BattleScript Pro 🛡️', 'color: #2563eb; font-size: 16px; font-weight: bold;');
    console.log('%cРазработано с ❤️ для карточных дуэлей', 'color: #7c3aed; font-size: 12px;');
});