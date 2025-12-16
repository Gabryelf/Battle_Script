// Конфигурация игры BattleScript
const GameConfig = {
    // Основные настройки игры
    game: {
        maxPlayers: 2,              // Максимум игроков (1 на 1)
        maxSpectators: 20,          // Максимум наблюдателей
        turnDuration: 120,          // Длительность хода в секундах
        startingHealth: 30,         // Начальное здоровье
        startingMana: 3,            // Начальная мана
        maxMana: 10,                // Максимальная мана
        maxHandSize: 10,            // Максимальный размер руки
        deckSize: 30,               // Размер колоды
        initialHandSize: 3,         // Начальное количество карт в руке
        cardsPerTurn: 1,            // Карт добавляется каждый ход
        drawCardCost: 1,            // Стоимость взятия карты (базовая)
        extraDrawCost: 0.5          // Дополнительная стоимость за карту в руке
    },
    
    // Настройки сервера
    server: {
        port: 3000,
        reconnectDelay: 3000,
        heartbeatInterval: 30000,
        inactiveTimeout: 300000     // 5 минут неактивности
    },
    
    // Настройки интерфейса
    ui: {
        cardWidth: 120,
        cardHeight: 180,
        cardScaleMobile: 0.8,
        animationDuration: 300,
        maxLogEntries: 100,
        maxChatMessages: 50
    },
    
    // Звуковые эффекты
    sounds: {
        enabled: true,
        volume: 0.5,
        sounds: {
            click: 'click',
            cardPlay: 'cardPlay',
            attack: 'attack',
            victory: 'victory',
            defeat: 'defeat',
            draw: 'draw'
        }
    },
    
    // Все карты игры (настраиваются администратором)
    cards: [
        // Обычные карты (Common)
        {
            id: 'warrior',
            name: 'Воин',
            type: 'creature',
            cost: 2,
            attack: 2,
            health: 4,
            rarity: 'common',
            abilities: [],
            description: 'Простой воин, основа армии.',
            image: '👨‍⚖️',
            color: '#6b7280'
        },
        {
            id: 'archer',
            name: 'Лучник',
            type: 'creature',
            cost: 3,
            attack: 3,
            health: 2,
            rarity: 'common',
            abilities: ['archer'],
            description: 'Стреляет издалека, избегая контратак.',
            image: '🏹',
            color: '#6b7280'
        },
        {
            id: 'healer',
            name: 'Целитель',
            type: 'creature',
            cost: 4,
            attack: 1,
            health: 4,
            rarity: 'common',
            abilities: ['healer'],
            description: 'Исцеляет союзников в конце хода.',
            image: '⛑️',
            color: '#6b7280'
        },
        
        // Редкие карты (Rare)
        {
            id: 'knight',
            name: 'Рыцарь',
            type: 'creature',
            cost: 4,
            attack: 3,
            health: 5,
            rarity: 'rare',
            abilities: ['taunt'],
            description: 'Защитник с щитом, принимает удары на себя.',
            image: '🛡️',
            color: '#3b82f6'
        },
        {
            id: 'berserker',
            name: 'Берсерк',
            type: 'creature',
            cost: 5,
            attack: 5,
            health: 3,
            rarity: 'rare',
            abilities: ['breakthrough'],
            description: 'Яростный воин, атакует дважды.',
            image: '⚔️',
            color: '#3b82f6'
        },
        {
            id: 'mage',
            name: 'Маг',
            type: 'creature',
            type: 'spell',
            cost: 3,
            attack: 3,
            health: 0,
            rarity: 'rare',
            abilities: ['area'],
            description: 'Наносит урон по площади.',
            image: '🔮',
            color: '#3b82f6'
        },
        
        // Эпические карты (Epic)
        {
            id: 'dragon',
            name: 'Дракон',
            type: 'creature',
            cost: 8,
            attack: 6,
            health: 6,
            rarity: 'epic',
            abilities: ['flying', 'area'],
            description: 'Могучее летающее существо.',
            image: '🐉',
            color: '#8b5cf6'
        },
        {
            id: 'assassin',
            name: 'Ассасин',
            type: 'creature',
            cost: 5,
            attack: 4,
            health: 2,
            rarity: 'epic',
            abilities: ['stealth', 'poison'],
            description: 'Незаметный убийца с отравленным клинком.',
            image: '🗡️',
            color: '#8b5cf6'
        },
        {
            id: 'paladin',
            name: 'Паладин',
            type: 'creature',
            cost: 6,
            attack: 3,
            health: 7,
            rarity: 'epic',
            abilities: ['taunt', 'healer', 'shield'],
            description: 'Святой воин, защищающий союзников.',
            image: '✝️',
            color: '#8b5cf6'
        },
        
        // Легендарные карты (Legendary)
        {
            id: 'phoenix',
            name: 'Феникс',
            type: 'creature',
            cost: 9,
            attack: 5,
            health: 5,
            rarity: 'legendary',
            abilities: ['flying', 'rebirth'],
            description: 'Возрождается после смерти с полным здоровьем.',
            image: '🦅',
            color: '#f59e0b'
        },
        {
            id: 'titan',
            name: 'Титан',
            type: 'creature',
            cost: 10,
            attack: 8,
            health: 8,
            rarity: 'legendary',
            abilities: ['taunt', 'breakthrough', 'shield'],
            description: 'Древний гигант, непробиваемая защита.',
            image: '🗿',
            color: '#f59e0b'
        },
        {
            id: 'necromancer',
            name: 'Некромант',
            type: 'creature',
            cost: 7,
            attack: 4,
            health: 5,
            rarity: 'legendary',
            abilities: ['summon', 'poison'],
            description: 'Призывает павших воинов обратно в бой.',
            image: '☠️',
            color: '#f59e0b'
        }
    ],
    
    // Способности карт
    abilities: {
        taunt: {
            name: 'Провокация',
            description: 'Противник должен атаковать это существо в первую очередь',
            costModifier: 1
        },
        breakthrough: {
            name: 'Прорыв',
            description: 'Наносит урон дважды (второй удар без контратаки)',
            costModifier: 1
        },
        stealth: {
            name: 'Скрытность',
            description: 'Не может быть целью атаки, пока не атакует сам',
            costModifier: 1
        },
        flying: {
            name: 'Полет',
            description: 'Может атаковать только летающих существ или героя',
            costModifier: 1
        },
        archer: {
            name: 'Стрелок',
            description: 'Атакует героя, контратакуют только летающие',
            costModifier: 1
        },
        area: {
            name: 'Площадной урон',
            description: 'Атакует 3 цели (напротив и по бокам)',
            costModifier: 2
        },
        healer: {
            name: 'Целитель',
            description: 'Восстанавливает здоровье союзникам в конце хода',
            costModifier: 2
        },
        shield: {
            name: 'Щит',
            description: 'Получает на 1 урона меньше от атак',
            costModifier: 1
        },
        poison: {
            name: 'Яд',
            description: 'Наносит 1 урона каждый ход после атаки',
            costModifier: 2
        },
        rebirth: {
            name: 'Возрождение',
            description: 'Возвращается в руку после смерти',
            costModifier: 3
        },
        summon: {
            name: 'Призыв',
            description: 'Призывает случайное существо при входе в игру',
            costModifier: 3
        }
    },
    
    // Редкости карт
    rarities: {
        common: {
            name: 'Обычная',
            color: '#6b7280',
            weight: 60,  // Вероятность выпадения в %
            maxCopies: 3 // Максимум копий в колоде
        },
        rare: {
            name: 'Редкая',
            color: '#3b82f6',
            weight: 25,
            maxCopies: 2
        },
        epic: {
            name: 'Эпическая',
            color: '#8b5cf6',
            weight: 10,
            maxCopies: 1
        },
        legendary: {
            name: 'Легендарная',
            color: '#f59e0b',
            weight: 5,
            maxCopies: 1
        }
    },
    
    // Деки по умолчанию
    defaultDecks: [
        {
            name: 'Стандартная',
            cards: [
                'warrior', 'warrior', 'warrior',
                'archer', 'archer',
                'healer',
                'knight', 'berserker',
                'mage',
                'dragon', 'assassin',
                'phoenix'
            ]
        },
        {
            name: 'Агрессивная',
            cards: [
                'warrior', 'warrior', 'warrior',
                'archer', 'archer', 'archer',
                'berserker', 'berserker',
                'mage', 'mage',
                'dragon',
                'titan'
            ]
        },
        {
            name: 'Защитная',
            cards: [
                'warrior', 'warrior',
                'knight', 'knight',
                'healer', 'healer',
                'paladin', 'paladin',
                'assassin',
                'necromancer',
                'phoenix',
                'titan'
            ]
        }
    ],
    
    // Баланс стоимости
    calculateCardValue: function(card) {
        let value = 0;
        
        if (card.type === 'creature') {
            value = (card.attack + card.health) / 2;
            
            // Модификаторы способностей
            if (card.abilities) {
                card.abilities.forEach(abilityId => {
                    const ability = this.abilities[abilityId];
                    if (ability) {
                        value += ability.costModifier;
                    }
                });
            }
            
            // Модификатор редкости
            const rarity = this.rarities[card.rarity];
            if (rarity) {
                value *= (1 + (Object.keys(this.rarities).indexOf(card.rarity) * 0.2));
            }
        } else if (card.type === 'spell') {
            value = card.attack * 0.5;
        }
        
        return Math.max(1, Math.round(value * 2) / 2);
    },
    
    // Получить карту по ID
    getCardById: function(id) {
        return this.cards.find(card => card.id === id);
    },
    
    // Создать колоду
    createDeck: function(deckName = 'Стандартная') {
        const deckConfig = this.defaultDecks.find(d => d.name === deckName) || this.defaultDecks[0];
        const deck = [];
        
        deckConfig.cards.forEach(cardId => {
            const cardTemplate = this.getCardById(cardId);
            if (cardTemplate) {
                const card = {
                    ...cardTemplate,
                    instanceId: `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    canAttack: false,
                    hasAttacked: false,
                    owner: null
                };
                deck.push(card);
            }
        });
        
        // Дополняем до нужного размера случайными картами
        while (deck.length < this.game.deckSize) {
            const randomCard = this.getRandomCard();
            if (randomCard) {
                const card = {
                    ...randomCard,
                    instanceId: `${randomCard.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    canAttack: false,
                    hasAttacked: false,
                    owner: null
                };
                deck.push(card);
            }
        }
        
        // Перемешиваем колоду
        return this.shuffleArray(deck);
    },
    
    // Получить случайную карту с учетом редкости
    getRandomCard: function() {
        const totalWeight = Object.values(this.rarities).reduce((sum, rarity) => sum + rarity.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarityId, rarity] of Object.entries(this.rarities)) {
            if (random < rarity.weight) {
                const cardsOfRarity = this.cards.filter(card => card.rarity === rarityId);
                if (cardsOfRarity.length > 0) {
                    return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
                }
            }
            random -= rarity.weight;
        }
        
        return this.cards[0]; // Fallback
    },
    
    // Перемешать массив
    shuffleArray: function(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    // Проверить баланс колоды
    validateDeck: function(deck) {
        if (!deck || !Array.isArray(deck)) return false;
        if (deck.length < this.game.deckSize * 0.8) return false;
        
        const cardCounts = {};
        deck.forEach(card => {
            cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
        });
        
        // Проверяем максимум копий
        for (const [cardId, count] of Object.entries(cardCounts)) {
            const card = this.getCardById(cardId);
            if (card) {
                const maxCopies = this.rarities[card.rarity].maxCopies;
                if (count > maxCopies) return false;
            }
        }
        
        return true;
    },
    
    // Получить цвет редкости
    getRarityColor: function(rarity) {
        return this.rarities[rarity]?.color || '#6b7280';
    },
    
    // Получить название редкости
    getRarityName: function(rarity) {
        return this.rarities[rarity]?.name || 'Обычная';
    },
    
    // Получить описание способности
    getAbilityDescription: function(abilityId) {
        return this.abilities[abilityId]?.description || '';
    },
    
    // Получить название способности
    getAbilityName: function(abilityId) {
        return this.abilities[abilityId]?.name || abilityId;
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}