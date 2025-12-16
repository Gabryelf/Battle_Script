class GameEngine {
    constructor(team, networkClient) {
        this.team = team;
        this.networkClient = networkClient;
        this.isMyTurn = false;
        
        this.state = {
            teamA: {
                mana: 3,
                maxMana: 3,
                health: 30,
                hand: [],
                board: [],
                deck: []
            },
            teamB: {
                mana: 3,
                maxMana: 3,
                health: 30,
                hand: [],
                board: [],
                deck: []
            },
            currentTurn: 'A',
            turnNumber: 1,
            selectedCard: null,
            gameStarted: false
        };
        
        this.setupNetworkCallbacks();
    }
    
    setupNetworkCallbacks() {
        this.networkClient.onGameStateUpdate = (data) => {
            this.handleGameStateUpdate(data);
        };
        
        this.networkClient.onCardPlayed = (data) => {
            this.handleCardPlayed(data);
        };
        
        this.networkClient.onAttack = (data) => {
            this.handleAttack(data);
        };
    }
    
    handleGameStateUpdate(data) {
        if (data.currentTurn) {
            this.state.currentTurn = data.currentTurn;
            this.state.turnNumber = data.turnNumber;
            this.isMyTurn = this.team === data.currentTurn;
        }
        
        if (data.teamA) {
            this.state.teamA.mana = data.teamA.mana || this.state.teamA.mana;
            this.state.teamA.health = data.teamA.health || this.state.teamA.health;
        }
        
        if (data.teamB) {
            this.state.teamB.mana = data.teamB.mana || this.state.teamB.mana;
            this.state.teamB.health = data.teamB.health || this.state.teamB.health;
        }
    }
    
    handleCardPlayed(data) {
        // Обновляем состояние после розыгрыша карты
        const team = data.team === 'A' ? 'teamA' : 'teamB';
        
        // Логика применения карты зависит от ее типа
        this.applyCardEffect(data.cardId, data.target, team);
    }
    
    handleAttack(data) {
        // Логика обработки атаки
        const attacker = this.findCardById(data.attackerId);
        const target = this.findCardById(data.targetId);
        
        if (attacker && target) {
            this.performAttack(attacker, target);
        }
    }
    
    // Основные методы игры
    loadCards(cards) {
        const team = this.team === 'A' ? 'teamA' : 'teamB';
        this.state[team].deck = cards;
        
        // Перемешиваем колоду
        this.shuffleArray(this.state[team].deck);
        
        // Раздаем начальные карты
        for (let i = 0; i < 3; i++) {
            this.drawCard(this.team);
        }
        
        // Отправляем на сервер
        this.networkClient.loadCards(this.team, cards);
    }
    
    drawCard(team) {
        const teamObj = team === 'A' ? 'teamA' : 'teamB';
        
        if (this.state[teamObj].deck.length > 0) {
            const card = this.state[teamObj].deck.pop();
            this.state[teamObj].hand.push(card);
            return card;
        }
        return null;
    }
    
    playCard(cardId, target = null) {
        if (!this.isMyTurn) return false;
        
        const teamObj = this.team === 'A' ? 'teamA' : 'teamB';
        const cardIndex = this.state[teamObj].hand.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return false;
        
        const card = this.state[teamObj].hand[cardIndex];
        
        // Проверяем ману
        if (this.state[teamObj].mana < card.cost) {
            return false;
        }
        
        // Используем ману
        this.state[teamObj].mana -= card.cost;
        
        // Убираем карту из руки
        this.state[teamObj].hand.splice(cardIndex, 1);
        
        // Обрабатываем карту
        if (card.type === 'creature') {
            // Существо идет на поле
            const boardCard = { ...card };
            boardCard.canAttack = false; // Не может атаковать в тот же ход
            this.state[teamObj].board.push(boardCard);
        } else if (card.type === 'spell' || card.type === 'artifact') {
            // Заклинание или артефакт применяется сразу
            this.applyCardEffect(card, target, teamObj);
        }
        
        // Отправляем на сервер
        this.networkClient.playCard(cardId, target);
        
        return true;
    }
    
    applyCardEffect(card, target, team) {
        // Реализация эффектов карт
        switch (card.type) {
            case 'spell':
                this.applySpell(card, target, team);
                break;
            case 'artifact':
                this.applyArtifact(card, target, team);
                break;
        }
    }
    
    applySpell(spell, target, team) {
        // Логика заклинаний
        const isHeal = spell.abilities?.includes('Целитель') || 
                      spell.description?.toLowerCase().includes('исцел');
        
        const isDamage = spell.abilities?.includes('Площадной урон') ||
                         spell.description?.toLowerCase().includes('урон');
        
        const targetTeam = team === 'teamA' ? 'teamB' : 'teamA';
        
        if (isHeal) {
            // Лечение
            if (target) {
                target.health = Math.min(target.health + spell.attack, target.maxHealth);
            } else if (this.state[team].board.length > 0) {
                // Лечим случайное существо
                const randomIndex = Math.floor(Math.random() * this.state[team].board.length);
                this.state[team].board[randomIndex].health = 
                    Math.min(this.state[team].board[randomIndex].health + spell.attack, 
                            this.state[team].board[randomIndex].maxHealth);
            } else {
                // Лечим героя
                this.state[team].health = Math.min(this.state[team].health + spell.attack, 30);
            }
        } else if (isDamage) {
            // Урон
            if (target) {
                target.health -= spell.attack;
                if (target.health <= 0) {
                    this.removeFromBoard(target.id, targetTeam);
                }
            } else if (this.state[targetTeam].board.length > 0) {
                // Бьем случайное существо
                const randomIndex = Math.floor(Math.random() * this.state[targetTeam].board.length);
                const targetCreature = this.state[targetTeam].board[randomIndex];
                targetCreature.health -= spell.attack;
                
                if (targetCreature.health <= 0) {
                    this.state[targetTeam].board.splice(randomIndex, 1);
                }
            } else {
                // Бьем героя
                this.state[targetTeam].health -= spell.attack;
                
                if (this.state[targetTeam].health <= 0) {
                    this.endGame(team === 'teamA' ? 'A' : 'B');
                }
            }
        }
    }
    
    applyArtifact(artifact, target, team) {
        if (!target && this.state[team].board.length > 0) {
            // Применяем на случайное существо
            const randomIndex = Math.floor(Math.random() * this.state[team].board.length);
            target = this.state[team].board[randomIndex];
        }
        
        if (target) {
            target.attack += artifact.attack || 0;
            target.health += artifact.health || 0;
            target.maxHealth += artifact.health || 0;
        }
    }
    
    performAttack(attacker, target) {
        if (!attacker.canAttack) return false;
        
        // Проверяем скрытность
        if (target.abilities?.includes('Скрытность') && !target.hasAttacked) {
            return false;
        }
        
        // Проверяем провокацию
        const enemyTeam = attacker.team === 'A' ? 'teamB' : 'teamA';
        const tauntCreatures = this.state[enemyTeam].board.filter(c => 
            c.abilities?.includes('Провокация')
        );
        
        if (tauntCreatures.length > 0 && !tauntCreatures.includes(target)) {
            target = tauntCreatures[Math.floor(Math.random() * tauntCreatures.length)];
        }
        
        // Наносим урон
        let damage = attacker.attack;
        
        // Учитываем щит
        if (target.abilities?.includes('Щит')) {
            damage = Math.max(0, damage - 1);
        }
        
        target.health -= damage;
        
        // Контратака
        if (target.health > 0 && !attacker.abilities?.includes('Полет')) {
            let counterDamage = target.attack;
            
            if (attacker.abilities?.includes('Щит')) {
                counterDamage = Math.max(0, counterDamage - 1);
            }
            
            attacker.health -= counterDamage;
        }
        
        // Проверяем смерть существ
        if (attacker.health <= 0) {
            this.removeFromBoard(attacker.id, attacker.team === 'A' ? 'teamA' : 'teamB');
        }
        
        if (target.health <= 0) {
            this.removeFromBoard(target.id, target.team === 'A' ? 'teamA' : 'teamB');
        }
        
        attacker.canAttack = false;
        
        // Отправляем на сервер
        this.networkClient.attack(attacker.id, target.id);
        
        return true;
    }
    
    autoAttack() {
        if (!this.isMyTurn) return false;
        
        const teamObj = this.team === 'A' ? 'teamA' : 'teamB';
        const enemyTeam = this.team === 'A' ? 'teamB' : 'teamA';
        
        let attacked = false;
        
        this.state[teamObj].board.forEach(attacker => {
            if (attacker.canAttack) {
                if (this.state[enemyTeam].board.length > 0) {
                    // Атакуем случайное вражеское существо
                    const randomIndex = Math.floor(Math.random() * this.state[enemyTeam].board.length);
                    const target = this.state[enemyTeam].board[randomIndex];
                    
                    this.performAttack(attacker, target);
                    attacked = true;
                } else {
                    // Атакуем героя
                    this.state[enemyTeam].health -= attacker.attack;
                    
                    if (this.state[enemyTeam].health <= 0) {
                        this.endGame(this.team);
                    }
                    
                    attacker.canAttack = false;
                    attacked = true;
                }
            }
        });
        
        return attacked;
    }
    
    endTurn() {
        if (!this.isMyTurn) return false;
        
        // Разрешаем всем существам атаковать в следующий ход
        const teamObj = this.team === 'A' ? 'teamA' : 'teamB';
        this.state[teamObj].board.forEach(creature => {
            creature.canAttack = true;
        });
        
        // Отправляем на сервер
        this.networkClient.endTurn();
        
        return true;
    }
    
    endGame(winner) {
        this.state.gameStarted = false;
        console.log(`Игра окончена! Победитель: Команда ${winner}`);
    }
    
    // Вспомогательные методы
    findCardById(cardId) {
        for (const team of ['teamA', 'teamB']) {
            for (const location of ['hand', 'board']) {
                const card = this.state[team][location].find(c => c.id === cardId);
                if (card) return card;
            }
        }
        return null;
    }
    
    removeFromBoard(cardId, team) {
        const index = this.state[team].board.findIndex(c => c.id === cardId);
        if (index !== -1) {
            this.state[team].board.splice(index, 1);
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    getState() {
        return this.state;
    }
    
    getTeamState(team) {
        const teamKey = team === 'A' ? 'teamA' : 'teamB';
        const enemyKey = team === 'A' ? 'teamB' : 'teamA';
        
        return {
            myTeam: {
                mana: this.state[teamKey].mana,
                maxMana: this.state[teamKey].maxMana,
                health: this.state[teamKey].health,
                hand: this.state[teamKey].hand,
                board: this.state[teamKey].board
            },
            enemyTeam: {
                mana: this.state[enemyKey].mana,
                health: this.state[enemyKey].health,
                board: this.state[enemyKey].board
            },
            currentTurn: this.state.currentTurn,
            turnNumber: this.state.turnNumber,
            isMyTurn: this.isMyTurn,
            gameStarted: this.state.gameStarted
        };
    }
}