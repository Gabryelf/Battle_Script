class BattleScriptProClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.playerName = null;
        this.playerAvatar = null;
        this.gameState = null;
        this.isPlayer = false;
        this.isSpectator = false;
        this.currentGameId = null;
        
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        
        this.turnTimer = null;
        this.timeLeft = 120;
        
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.sidePanelOpen = false;
        this.cardTooltip = null;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.createParticles();
        this.setupBoardCells();
        this.setupAvatarSelection();
        this.connectToServer();
        this.setupCardTooltip();
        
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
        
        setTimeout(() => {
            if (!localStorage.getItem('battlescript_help_shown')) {
                this.addGameLog('Добро пожаловать в BattleScript Pro! Для начала игры нажмите "Войти в игру"', 'info');
                localStorage.setItem('battlescript_help_shown', 'true');
            }
        }, 2000);
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
        
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('nameInput').value = e.target.dataset.name;
            });
        });
        
        // Игровой экран
        document.getElementById('attackBtn').addEventListener('click', () => this.initiateAttack());
        document.getElementById('playCardBtn').addEventListener('click', () => this.playSelectedCard());
        document.getElementById('autoAttackBtn').addEventListener('click', () => this.autoAttack());
        document.getElementById('useArtifactBtn').addEventListener('click', () => this.useSelectedArtifact());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
        
        // Боковая панель
        document.getElementById('panelToggle').addEventListener('click', () => this.toggleSidePanel());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
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
    }
    
    setupBoardCells() {
        const playerGrid = document.getElementById('playerBoardGrid');
        const opponentGrid = document.getElementById('opponentBoardGrid');
        
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
    
    setupAvatarSelection() {
        const avatarsGrid = document.getElementById('avatarsGrid');
        
        GameConfig.avatars.forEach(avatar => {
            const option = document.createElement('div');
            option.className = `avatar-option ${avatar.id === (this.playerAvatar || 'warrior') ? 'selected' : ''}`;
            option.dataset.avatar = avatar.id;
            
            option.innerHTML = `
                <img src="${avatar.image}" alt="${avatar.name}" onerror="this.src='https://i.imgur.com/6V9zLqW.png'">
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
    
    setupCardTooltip() {
        this.cardTooltip = document.createElement('div');
        this.cardTooltip.className = 'card-tooltip';
        document.body.appendChild(this.cardTooltip);
    }
    
    showCardTooltip(card, x, y) {
        if (!card) return;
        
        let abilitiesHTML = '';
        if (card.abilities && card.abilities.length > 0) {
            abilitiesHTML = `
                <div class="tooltip-abilities">
                    <strong>Способности:</strong>
                    <div class="ability-list">
                        ${card.abilities.map(ability => {
                            const abilityInfo = GameConfig.abilities[ability];
                            return `<div class="ability-item">
                                <i class="fas fa-${abilityInfo?.icon || 'star'}"></i>
                                <span>${abilityInfo?.name || ability}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        this.cardTooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-name">${card.name}</span>
                <span class="tooltip-cost">${card.cost}</span>
            </div>
            <div class="tooltip-type">${card.type === 'creature' ? 'Существо' : card.type === 'spell' ? 'Заклинание' : 'Артефакт'}</div>
            <div class="tooltip-description">${card.description || 'Нет описания'}</div>
            ${card.type === 'creature' ? `
                <div class="tooltip-stats">
                    <span class="stat attack">⚔️ ${card.attack}</span>
                    <span class="stat health">❤️ ${card.health}</span>
                </div>
            ` : ''}
            ${abilitiesHTML}
        `;
        
        this.cardTooltip.style.left = (x + 20) + 'px';
        this.cardTooltip.style.top = (y - this.cardTooltip.offsetHeight / 2) + 'px';
        this.cardTooltip.style.display = 'block';
    }
    
    hideCardTooltip() {
        if (this.cardTooltip) {
            this.cardTooltip.style.display = 'none';
        }
    }
    
    connectToServer() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const port = 3000;
        const wsUrl = `${protocol}//${host}:${port}`;
        
        this.showLoading('Подключение к серверу...');
        
        try {
            this.ws = new WebSocket(wsUrl);
            
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
            case 'artifact_used':
                this.handleArtifactUsed(data);
                break;
            case 'quest_completed':
                this.handleQuestCompleted(data);
                break;
            case 'card_added':
                this.handleCardAdded(data);
                break;
            case 'chat_message':
                this.handleChatMessage(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            default:
                console.warn(`⚠️ Неизвестный тип сообщения:`, data.type);
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
        this.playerAvatar = data.avatar;
        this.updatePlayerDisplay();
        this.hideNameModal();
        
        this.addGameLog(`Вы вошли как ${this.playerName}`, 'success');
        this.playSound('login');
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
            setTimeout(() => {
                alert(`🎉 Победа! ${data.message}`);
                this.returnToMain();
            }, 1000);
        } else {
            this.playSound('defeat');
            setTimeout(() => {
                alert(`💥 Поражение. ${data.message}`);
                this.returnToMain();
            }, 1000);
        }
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
    
    handleCardAdded(data) {
        if (this.isPlayer && this.gameState && 
            this.gameState.currentTurn === this.clientId) {
            this.addGameLog(`Добавлена карта: ${data.card.name}`, 'success');
            this.playSound('draw');
        }
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
        const nameDisplay = document.getElementById('playerNameDisplay');
        const avatarImg = document.getElementById('playerAvatarImg');
        const statusBadge = document.getElementById('playerStatusBadge');
        
        if (nameDisplay) nameDisplay.textContent = this.playerName || 'Неизвестный игрок';
        if (avatarImg) avatarImg.src = GameConfig.getAvatarById(this.playerAvatar)?.image || 'https://i.imgur.com/6V9zLqW.png';
        if (statusBadge) statusBadge.textContent = this.gameState ? 'В игре' : 'Не в игре';
    }
    
    showNameModal() {
        document.getElementById('nameModal').classList.add('active');
        document.getElementById('nameInput').focus();
        document.getElementById('nameInput').value = this.playerName || '';
        
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === this.playerAvatar) {
                option.classList.add('selected');
            }
        });
    }
    
    hideNameModal() {
        document.getElementById('nameModal').classList.remove('active');
    }
    
    confirmName() {
        const nameInput = document.getElementById('nameInput');
        const name = nameInput.value.trim();
        
        if (name.length < 2) {
            this.showError('Имя должно содержать минимум 2 символа');
            return;
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
    }
    
    showGameScreen() {
        document.getElementById('mainScreen').classList.remove('active-screen');
        document.getElementById('gameScreen').classList.add('active-screen');
        this.handleResize();
        this.addGameLog('Добро пожаловать на поле боя!', 'success');
    }
    
    showMainScreen() {
        document.getElementById('gameScreen').classList.remove('active-screen');
        document.getElementById('mainScreen').classList.add('active-screen');
        this.resetGameState();
        this.updatePlayerDisplay();
    }
    
    updatePlayerView(isPlayer1) {
        if (!this.gameState) return;
        
        const player = this.gameState.player;
        const opponent = this.gameState.opponent;
        
        // Обновляем информацию игрока
        document.getElementById('playerNameGame').textContent = player.name;
        const playerAvatarImg = document.getElementById('playerAvatarImgGame');
        playerAvatarImg.src = player.avatarData?.image || 'https://i.imgur.com/6V9zLqW.png';
        playerAvatarImg.onerror = () => {
            playerAvatarImg.src = 'https://i.imgur.com/6V9zLqW.png';
        };
        
        document.getElementById('playerHealth').textContent = player.health;
        document.getElementById('playerMana').textContent = player.mana;
        document.getElementById('playerMaxMana').textContent = player.maxMana;
        document.getElementById('playerHandCount').textContent = player.hand?.length || 0;
        document.getElementById('playerDeckCount').textContent = player.deckSize || 30;
        
        // Обновляем информацию противника
        document.getElementById('opponentName').textContent = opponent.name;
        const opponentAvatarImg = document.getElementById('opponentAvatarImg');
        opponentAvatarImg.src = opponent.avatarData?.image || 'https://i.imgur.com/6V9zLqW.png';
        opponentAvatarImg.onerror = () => {
            opponentAvatarImg.src = 'https://i.imgur.com/6V9zLqW.png';
        };
        
        document.getElementById('opponentHealth').textContent = opponent.health;
        document.getElementById('opponentMana').textContent = opponent.mana;
        document.getElementById('opponentMaxMana').textContent = opponent.maxMana;
        document.getElementById('opponentHandCount').textContent = opponent.handSize || 0;
        
        // Обновляем счетчик артефактов
        document.getElementById('artifactDeckCount').textContent = this.gameState.artifactDeckSize || 0;
        
        // Рендерим руку
        this.renderHand('playerHand', player.hand || []);
        
        // Рендерим поля
        this.renderBoard('playerBoardGrid', player.board || [], true);
        this.renderBoard('opponentBoardGrid', opponent.board || [], false);
        
        // Рендерим артефакты
        this.renderArtifacts('artifactContainer', player.artifacts || []);
        
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
        
        document.getElementById('playerNameGame').textContent = 'Наблюдатель';
        document.getElementById('playerAvatarImgGame').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('playerHealth').textContent = '∞';
        document.getElementById('playerMana').textContent = '∞';
        document.getElementById('playerMaxMana').textContent = '∞';
        
        document.getElementById('opponentName').textContent = `${player1.name} vs ${player2.name}`;
        document.getElementById('opponentAvatarImg').src = 'https://i.imgur.com/6V9zLqW.png';
        document.getElementById('opponentHealth').textContent = '∞';
        
        this.renderHand('playerHand', []);
        this.renderBoard('playerBoardGrid', player1.board || [], false);
        this.renderBoard('opponentBoardGrid', player2.board || [], false);
        
        this.updateControls(false);
        
        this.addGameLog('Вы наблюдаете за игрой', 'info');
    }
    
    renderHand(containerId, hand) {
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
            const cardElement = this.createCardElement(card, 'hand');
            cardElement.style.transform = `translateX(${index * 10}px)`;
            cardElement.style.zIndex = index;
            
            cardElement.addEventListener('mouseenter', (e) => {
                this.handleCardHover(cardElement, true);
                this.showCardTooltip(card, e.clientX, e.clientY);
            });
            
            cardElement.addEventListener('mousemove', (e) => {
                this.showCardTooltip(card, e.clientX, e.clientY);
            });
            
            cardElement.addEventListener('mouseleave', () => {
                this.handleCardHover(cardElement, false);
                this.hideCardTooltip();
            });
            
            cardElement.addEventListener('click', () => {
                this.selectCard(card);
            });
            
            container.appendChild(cardElement);
        });
        
        container.querySelectorAll('.card-in-hand').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = `translateX(${index * 10}px) translateY(0)`;
            }, index * 50);
        });
    }
    
    handleCardHover(cardElement, isHovering) {
        if (isHovering) {
            cardElement.style.transform = 'translateY(-80px) scale(2.5)';
            cardElement.style.zIndex = '2000';
            cardElement.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(37, 99, 235, 0.7)';
        } else if (!cardElement.classList.contains('selected')) {
            const cards = document.querySelectorAll('.card-in-hand');
            const index = Array.from(cards).indexOf(cardElement);
            cardElement.style.transform = `translateX(${index * 10}px) translateY(0) scale(1)`;
            cardElement.style.zIndex = index;
            cardElement.style.boxShadow = 'var(--shadow-lg)';
        }
    }
    
    createCardElement(cardData, location) {
        const card = document.createElement('div');
        card.className = `card-in-hand ${this.selectedCard?.instanceId === cardData.instanceId ? 'selected' : ''}`;
        card.dataset.id = cardData.instanceId;
        card.dataset.type = cardData.type;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        let statsHTML = '';
        if (cardData.type === 'creature') {
            statsHTML = `
                <div class="card-stats">
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
        
        if (cardData.image) {
            const img = new Image();
            img.src = cardData.image;
            img.onerror = () => {
                const placeholder = card.querySelector('.card-image-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = `<i class="fas fa-${cardData.type === 'creature' ? 'dragon' : 'bolt'}"></i>`;
                }
            };
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
    
    renderBoard(containerId, board, isOwnBoard) {
        const container = document.getElementById(containerId);
        
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
        
        board.forEach((creature, index) => {
            if (creature) {
                const cell = container.querySelector(`[data-cell="${index}"]`);
                if (cell) {
                    cell.classList.add('occupied');
                    
                    const creatureElement = this.createCreatureElement(creature, isOwnBoard);
                    cell.appendChild(creatureElement);
                    
                    if (isOwnBoard && creature.canAttack && !creature.hasAttacked && !this.isSpectator) {
                        creatureElement.classList.add('attackable');
                        creatureElement.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.selectAttacker(creature);
                        });
                    }
                    
                    creatureElement.addEventListener('mouseenter', (e) => {
                        this.showCardTooltip(creature, e.clientX, e.clientY);
                    });
                    
                    creatureElement.addEventListener('mousemove', (e) => {
                        this.showCardTooltip(creature, e.clientX, e.clientY);
                    });
                    
                    creatureElement.addEventListener('mouseleave', () => {
                        this.hideCardTooltip();
                    });
                }
            }
        });
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
        
        if (creature.image) {
            const img = new Image();
            img.src = creature.image;
            img.onerror = () => {
                const placeholder = element.querySelector('.creature-image-placeholder');
                if (placeholder) {
                    placeholder.innerHTML = '<i class="fas fa-dragon"></i>';
                }
            };
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
                cardElement.style.transform = 'translateY(-60px) scale(2.2)';
                cardElement.style.zIndex = '1000';
                cardElement.style.boxShadow = 'var(--shadow-xl), 0 0 30px rgba(245, 158, 11, 0.7)';
                this.addGameLog(`Выбрана карта: ${card.name}`, 'info');
            }
            
            this.updateControls(true);
            this.playSound('select');
        }
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
    }
    
    selectAttacker(creature) {
        if (!this.isPlayer || !this.gameState || this.isSpectator) return;
        
        const player = this.gameState.player;
        if (this.gameState.currentTurn !== player.id) {
            this.addGameLog('Сейчас не ваш ход', 'error');
            this.playSound('error');
            return;
        }
        
        if (!creature.canAttack || creature.hasAttacked) {
            this.addGameLog('Это существо не может атаковать', 'error');
            this.playSound('error');
            return;
        }
        
        this.selectedAttacker = creature;
        this.targetMode = 'attack';
        
        this.highlightAttackTargets(creature);
        
        this.addGameLog('Выберите цель для атаки', 'info');
        this.playSound('select');
    }
    
    highlightAttackTargets(attacker) {
        if (!this.gameState) return;
        
        const opponent = this.gameState.opponent;
        
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        opponent.board.forEach((creature, cell) => {
            if (creature) {
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
        
        const heroCell = document.querySelector('.opponent-panel');
        if (heroCell) {
            heroCell.classList.add('highlighted');
            heroCell.addEventListener('click', () => {
                this.executeAttack(attacker.instanceId, 'hero');
            }, { once: true });
        }
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
        
        if (player.board[cellIndex]) {
            this.addGameLog('Ячейка уже занята', 'error');
            this.playSound('error');
            return;
        }
        
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
            this.targetMode = 'play';
            this.highlightAvailableCells();
            this.addGameLog('Выберите ячейку для существа', 'info');
        } else {
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
        
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
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
    }
    
    executeAttack(attackerId, targetId) {
        this.clearAttackTargets();
        
        this.sendToServer({
            type: 'attack',
            attackerId: attackerId,
            targetId: targetId
        });
    }
    
    clearAttackTargets() {
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
            el.onclick = null;
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
    }
    
    useSelectedArtifact() {
        if (!this.selectedArtifact) {
            this.addGameLog('Выберите артефакт', 'error');
            this.playSound('error');
            return;
        }
        
        this.targetMode = 'artifact';
        this.addGameLog('Выберите цель для артефакта', 'info');
        this.highlightArtifactTargets();
    }
    
    highlightArtifactTargets() {
        if (!this.gameState) return;
        
        const player = this.gameState.player;
        
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
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
        this.clearSelections();
    }
    
    clearSelections() {
        this.selectedCard = null;
        this.selectedArtifact = null;
        this.selectedAttacker = null;
        this.targetMode = null;
        
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
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
        
        document.getElementById('currentTurnPlayer').textContent = currentPlayer.name;
        document.getElementById('turnNumber').textContent = this.gameState.turnNumber || 1;
        
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
            
            if (this.timeLeft <= 30) {
                timerDisplay.style.color = 'var(--accent-red)';
            } else if (this.timeLeft <= 60) {
                timerDisplay.style.color = 'var(--accent-yellow)';
            } else {
                timerDisplay.style.color = 'var(--accent-blue)';
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
            ['attackBtn', 'playCardBtn', 'autoAttackBtn', 'useArtifactBtn', 'endTurnBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.disabled = true;
                }
            });
            return;
        }
        
        const isActive = isMyTurn && this.gameState?.status === 'active';
        
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
        
        this.updateGameInfo();
        
        this.turnTimer = setInterval(() => {
            this.timeLeft--;
            this.updateGameInfo();
            
            if (this.timeLeft <= 0) {
                this.stopTurnTimer();
                if (this.isPlayer && this.gameState?.currentTurn === this.clientId) {
                    this.addGameLog('Время хода истекло!', 'error');
                    this.endTurn();
                }
            }
            
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
        
        if (this.sendToServer({
            type: 'chat_message',
            message: message
        })) {
            input.value = '';
        }
    }
    
    toggleSidePanel() {
        const panel = document.getElementById('sidePanel');
        const toggle = document.getElementById('panelToggle');
        
        this.sidePanelOpen = !this.sidePanelOpen;
        panel.classList.toggle('active', this.sidePanelOpen);
        
        if (this.sidePanelOpen) {
            toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            toggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    }
    
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
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
        
        this.sidePanelOpen = false;
        document.getElementById('sidePanel').classList.remove('active');
        document.getElementById('panelToggle').innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        const elementsToClear = [
            'playerHand', 'playerBoardGrid', 'opponentBoardGrid', 
            'gameLog', 'chatMessages', 'artifactContainer'
        ];
        
        elementsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });
        
        document.getElementById('currentQuest').textContent = 'Выполните условие';
        document.getElementById('questProgressFill').style.width = '0%';
        document.getElementById('questProgressText').textContent = '0/0';
        document.getElementById('currentTurnPlayer').textContent = 'Ожидание...';
        document.getElementById('gameTimer').textContent = '02:00';
        
        this.updatePlayerDisplay();
        
        this.addGameLog('Возврат в главное меню', 'info');
    }
    
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
        console.log(`🔊 Воспроизведение звука: ${soundName}`);
        
        if (navigator.vibrate && soundName === 'attack') {
            navigator.vibrate(50);
        }
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
    
    handleResize() {
        const width = window.innerWidth;
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        
        // Поднимаем поле битвы и опускаем руку
        if (isMobile) {
            document.documentElement.style.setProperty('--battle-field-margin-top', '120px');
            document.documentElement.style.setProperty('--player-hand-bottom', '120px');
            document.documentElement.style.setProperty('--player-hand-height', '180px');
        } else if (isTablet) {
            document.documentElement.style.setProperty('--battle-field-margin-top', '140px');
            document.documentElement.style.setProperty('--player-hand-bottom', '140px');
            document.documentElement.style.setProperty('--player-hand-height', '200px');
        } else {
            document.documentElement.style.setProperty('--battle-field-margin-top', '160px');
            document.documentElement.style.setProperty('--player-hand-bottom', '160px');
            document.documentElement.style.setProperty('--player-hand-height', '240px');
        }
        
        // Обновляем CSS для поднятия поля битвы
        const battleField = document.querySelector('.battle-field');
        const playerHand = document.querySelector('.player-hand');
        
        if (battleField) {
            battleField.style.marginTop = getComputedStyle(document.documentElement).getPropertyValue('--battle-field-margin-top');
        }
        
        if (playerHand) {
            playerHand.style.bottom = getComputedStyle(document.documentElement).getPropertyValue('--player-hand-bottom');
            playerHand.style.height = getComputedStyle(document.documentElement).getPropertyValue('--player-hand-height');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    cleanup() {
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 BattleScript Pro - Улучшенный интерфейс инициализирован');
    
    if (!window.WebSocket) {
        alert('Ваш браузер не поддерживает WebSocket. Пожалуйста, используйте современный браузер.');
        return;
    }
    
    window.gameClient = new BattleScriptProClient();
    
    document.addEventListener('keydown', (e) => {
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