class NetworkClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.clientId = null;
        this.team = null;
        
        this.callbacks = {
            connectionChange: null,
            gameStateUpdate: null,
            playersUpdate: null,
            chatMessage: null,
            cardPlayed: null,
            attack: null,
            error: null
        };
    }
    
    connect(host = 'localhost', port = 3000) {
        const wsUrl = `ws://${host}:${port}`;
        console.log(`Подключение к ${wsUrl}...`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Подключение установлено');
            this.connected = true;
            
            if (this.callbacks.connectionChange) {
                this.callbacks.connectionChange(true);
            }
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Ошибка обработки сообщения:', error);
            }
        };
        
        this.ws.onclose = () => {
            console.log('Подключение закрыто');
            this.connected = false;
            
            if (this.callbacks.connectionChange) {
                this.callbacks.connectionChange(false);
            }
            
            // Пытаемся переподключиться
            setTimeout(() => {
                if (!this.connected) {
                    this.connect(host, port);
                }
            }, 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('Ошибка WebSocket:', error);
        };
    }
    
    handleMessage(data) {
        console.log('Получено сообщение:', data);
        
        switch (data.type) {
            case 'init':
                this.clientId = data.clientId;
                if (this.callbacks.gameStateUpdate) {
                    this.callbacks.gameStateUpdate(data.gameState);
                }
                break;
                
            case 'player_joined':
            case 'player_left':
                if (this.callbacks.playersUpdate) {
                    this.callbacks.playersUpdate(data.teams);
                }
                break;
                
            case 'turn_changed':
                if (this.callbacks.gameStateUpdate) {
                    this.callbacks.gameStateUpdate(data);
                }
                break;
                
            case 'cards_loaded':
                console.log(`${data.player} загрузил карты для команды ${data.team}`);
                break;
                
            case 'card_played':
                if (this.callbacks.cardPlayed) {
                    this.callbacks.cardPlayed(data);
                }
                break;
                
            case 'attack':
                if (this.callbacks.attack) {
                    this.callbacks.attack(data);
                }
                break;
                
            case 'chat_message':
                if (this.callbacks.chatMessage) {
                    this.callbacks.chatMessage(data);
                }
                break;
                
            case 'error':
                if (this.callbacks.error) {
                    this.callbacks.error(data);
                }
                break;
        }
    }
    
    send(data) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('Не могу отправить сообщение: нет подключения');
        }
    }
    
    joinTeam(team, playerName) {
        this.team = team;
        this.send({
            type: 'join_team',
            team: team,
            playerName: playerName
        });
    }
    
    loadCards(team, cards) {
        this.send({
            type: 'load_cards',
            team: team,
            cards: cards
        });
    }
    
    playCard(cardId, target = null) {
        this.send({
            type: 'play_card',
            cardId: cardId,
            target: target
        });
    }
    
    attack(attackerId, targetId) {
        this.send({
            type: 'attack',
            attackerId: attackerId,
            targetId: targetId
        });
    }
    
    endTurn() {
        this.send({
            type: 'end_turn'
        });
    }
    
    sendChatMessage(message) {
        this.send({
            type: 'chat_message',
            message: message
        });
    }
    
    isConnected() {
        return this.connected && this.ws.readyState === WebSocket.OPEN;
    }
    
    // Callback методы
    onConnectionChange(callback) {
        this.callbacks.connectionChange = callback;
    }
    
    onGameStateUpdate(callback) {
        this.callbacks.gameStateUpdate = callback;
    }
    
    onPlayersUpdate(callback) {
        this.callbacks.playersUpdate = callback;
    }
    
    onCardPlayed(callback) {
        this.callbacks.cardPlayed = callback;
    }
    
    onAttack(callback) {
        this.callbacks.attack = callback;
    }
    
    onChatMessage(callback) {
        this.callbacks.chatMessage = callback;
    }
    
    onError(callback) {
        this.callbacks.error = callback;
    }
}

// Создаем глобальный экземпляр
const networkClient = new NetworkClient();