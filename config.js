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
        maxBoardSize: 5,            // Максимум существ на поле
        artifactDeckSize: 10        // Размер колоды артефактов
    },
    
    // Настройки сервера
    server: {
        port: 3000,
        reconnectDelay: 3000,
        heartbeatInterval: 30000,
        inactiveTimeout: 300000
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
        volume: 0.5
    },
    
    // Аватары героев
    avatars: [
        {
            id: 'warrior',
            name: 'Воин',
            icon: 'fa-user-warrior',
            color: '#dc2626',
            description: 'Сильный воин, специалист в ближнем бою',
            startingArtifacts: ['warrior_sword', 'warrior_shield'],
            bonusHealth: 5,
            bonusMana: 0
        },
        {
            id: 'mage',
            name: 'Маг',
            icon: 'fa-hat-wizard',
            color: '#7c3aed',
            description: 'Могущественный волшебник, владеет магией',
            startingArtifacts: ['mage_staff', 'spellbook'],
            bonusHealth: -5,
            bonusMana: 3
        },
        {
            id: 'archer',
            name: 'Стрелок',
            icon: 'fa-bow-arrow',
            color: '#059669',
            description: 'Меткий стрелок, атакует издалека',
            startingArtifacts: ['longbow', 'leather_armor'],
            bonusHealth: 0,
            bonusMana: 1
        },
        {
            id: 'cleric',
            name: 'Жрец',
            icon: 'fa-hands-praying',
            color: '#f59e0b',
            description: 'Святой лекарь, исцеляет союзников',
            startingArtifacts: ['holy_symbol', 'healing_potion'],
            bonusHealth: 10,
            bonusMana: 2
        },
        {
            id: 'rogue',
            name: 'Разбойник',
            icon: 'fa-mask',
            color: '#4b5563',
            description: 'Хитрый и скрытный, наносит внезапные удары',
            startingArtifacts: ['dagger', 'cloak'],
            bonusHealth: -3,
            bonusMana: 1
        },
        {
            id: 'knight',
            name: 'Рыцарь',
            icon: 'fa-helmet-battle',
            color: '#3b82f6',
            description: 'Благородный защитник в тяжелых доспехах',
            startingArtifacts: ['plate_armor', 'banner'],
            bonusHealth: 15,
            bonusMana: -2
        }
    ],
    
    // Все карты существ
    creatureCards: [
        // Обычные карты (Common)
        {
            id: 'footman',
            name: 'Пехотинец',
            type: 'creature',
            cost: 1,
            attack: 1,
            health: 2,
            rarity: 'common',
            abilities: [],
            tags: ['human', 'warrior', 'has_legs'],
            description: 'Простой пехотинец, основа любой армии.',
            image: '🛡️',
            color: '#6b7280'
        },
        {
            id: 'wolf',
            name: 'Волк',
            type: 'creature',
            cost: 2,
            attack: 2,
            health: 2,
            rarity: 'common',
            abilities: ['charge'],
            tags: ['beast', 'quadruped'],
            description: 'Быстрый хищник, атакует сразу при выходе.',
            image: '🐺',
            color: '#6b7280'
        },
        {
            id: 'skeleton',
            name: 'Скелет',
            type: 'creature',
            cost: 1,
            attack: 1,
            health: 1,
            rarity: 'common',
            abilities: ['undead'],
            tags: ['undead', 'skeleton'],
            description: 'Восставший скелет, не чувствует боли.',
            image: '💀',
            color: '#6b7280'
        },
        
        // Редкие карты (Rare)
        {
            id: 'knight',
            name: 'Рыцарь',
            type: 'creature',
            cost: 3,
            attack: 2,
            health: 4,
            rarity: 'rare',
            abilities: ['taunt'],
            tags: ['human', 'knight', 'has_legs', 'has_arms'],
            description: 'Облаченный в броню защитник.',
            image: '⚔️',
            color: '#3b82f6'
        },
        {
            id: 'ogre',
            name: 'Огр',
            type: 'creature',
            cost: 4,
            attack: 4,
            health: 4,
            rarity: 'rare',
            abilities: ['trample'],
            tags: ['giant', 'has_legs', 'has_arms'],
            description: 'Огромное существо, проходящее сквозь врагов.',
            image: '👹',
            color: '#3b82f6'
        },
        {
            id: 'harpy',
            name: 'Гарпия',
            type: 'creature',
            cost: 3,
            attack: 2,
            health: 2,
            rarity: 'rare',
            abilities: ['flying'],
            tags: ['flying', 'bird', 'has_wings'],
            description: 'Крылатое существо, атакует с воздуха.',
            image: '🦅',
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
            abilities: ['flying', 'breath'],
            tags: ['dragon', 'flying', 'has_wings', 'has_legs'],
            description: 'Могучее летающее существо, дышащее огнем.',
            image: '🐉',
            color: '#8b5cf6'
        },
        {
            id: 'giant_spider',
            name: 'Гигантский паук',
            type: 'creature',
            cost: 5,
            attack: 3,
            health: 5,
            rarity: 'epic',
            abilities: ['web'],
            tags: ['spider', 'arachnid', 'many_legs'],
            description: 'Огромный паук, опутывающий врагов паутиной.',
            image: '🕷️',
            color: '#8b5cf6'
        },
        {
            id: 'elemental',
            name: 'Элементаль',
            type: 'creature',
            cost: 6,
            attack: 4,
            health: 6,
            rarity: 'epic',
            abilities: ['immune_spells'],
            tags: ['elemental', 'magical'],
            description: 'Существо чистой магии, невосприимчиво к заклинаниям.',
            image: '🌊',
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
            tags: ['bird', 'flying', 'has_wings', 'mythical'],
            description: 'Легендарная птица, возрождающаяся из пепла.',
            image: '🔥',
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
            abilities: ['trample', 'immune_spells'],
            tags: ['giant', 'titan', 'has_legs', 'has_arms', 'mythical'],
            description: 'Древний гигант, непробиваемая мощь.',
            image: '🗿',
            color: '#f59e0b'
        },
        {
            id: 'leviathan',
            name: 'Левиафан',
            type: 'creature',
            cost: 12,
            attack: 10,
            health: 10,
            rarity: 'legendary',
            abilities: ['underwater', 'tsunami'],
            tags: ['sea', 'leviathan', 'aquatic', 'mythical'],
            description: 'Морское чудовище, вызывающее цунами.',
            image: '🌊',
            color: '#f59e0b'
        }
    ],
    
    // Карты заклинаний
    spellCards: [
        {
            id: 'fireball',
            name: 'Огненный шар',
            type: 'spell',
            cost: 3,
            effect: 'damage',
            value: 4,
            rarity: 'common',
            description: 'Наносит 4 урона цели.',
            image: '🔥',
            color: '#dc2626'
        },
        {
            id: 'heal',
            name: 'Исцеление',
            type: 'spell',
            cost: 2,
            effect: 'heal',
            value: 4,
            rarity: 'common',
            description: 'Восстанавливает 4 здоровья цели.',
            image: '💚',
            color: '#059669'
        },
        {
            id: 'lightning',
            name: 'Молния',
            type: 'spell',
            cost: 4,
            effect: 'damage',
            value: 6,
            rarity: 'rare',
            description: 'Наносит 6 урона цели.',
            image: '⚡',
            color: '#f59e0b'
        },
        {
            id: 'frost_nova',
            name: 'Ледяная буря',
            type: 'spell',
            cost: 5,
            effect: 'freeze_all',
            value: 1,
            rarity: 'epic',
            description: 'Замораживает всех существ противника на 1 ход.',
            image: '❄️',
            color: '#3b82f6'
        },
        {
            id: 'meteor',
            name: 'Метеорит',
            type: 'spell',
            cost: 8,
            effect: 'damage_all',
            value: 5,
            rarity: 'legendary',
            description: 'Наносит 5 урона всем существам.',
            image: '☄️',
            color: '#f59e0b'
        }
    ],
    
    // Карты артефактов
    artifactCards: [
        {
            id: 'warrior_sword',
            name: 'Меч воина',
            type: 'artifact',
            cost: 0,
            requirements: ['has_arms'],
            effect: 'attack_buff',
            value: 2,
            rarity: 'common',
            description: 'Меч, увеличивающий атаку существа на 2.',
            image: '🗡️',
            color: '#6b7280'
        },
        {
            id: 'warrior_shield',
            name: 'Щит воина',
            type: 'artifact',
            cost: 0,
            requirements: ['has_arms'],
            effect: 'health_buff',
            value: 3,
            rarity: 'common',
            description: 'Щит, увеличивающий здоровье существа на 3.',
            image: '🛡️',
            color: '#6b7280'
        },
        {
            id: 'mage_staff',
            name: 'Посох мага',
            type: 'artifact',
            cost: 0,
            requirements: ['has_arms', 'magical'],
            effect: 'spell_power',
            value: 2,
            rarity: 'rare',
            description: 'Увеличивает силу заклинаний на 2.',
            image: '🪄',
            color: '#7c3aed'
        },
        {
            id: 'longbow',
            name: 'Длинный лук',
            type: 'artifact',
            cost: 0,
            requirements: ['has_arms'],
            effect: 'ranged',
            value: 1,
            rarity: 'rare',
            description: 'Позволяет существу атаковать с расстояния.',
            image: '🏹',
            color: '#059669'
        },
        {
            id: 'plate_armor',
            name: 'Латные доспехи',
            type: 'artifact',
            cost: 0,
            requirements: ['humanoid', 'has_legs'],
            effect: 'armor',
            value: 5,
            rarity: 'epic',
            description: 'Тяжелые доспехи, дающие 5 брони.',
            image: '🥋',
            color: '#3b82f6'
        },
        {
            id: 'wings',
            name: 'Крылья',
            type: 'artifact',
            cost: 0,
            requirements: [],
            effect: 'flying',
            value: 0,
            rarity: 'legendary',
            description: 'Дает способность летать.',
            image: '🪽',
            color: '#f59e0b'
        },
        {
            id: 'boots',
            name: 'Волшебные сапоги',
            type: 'artifact',
            cost: 0,
            requirements: ['has_legs'],
            effect: 'speed',
            value: 1,
            rarity: 'common',
            description: 'Увеличивает скорость, давая возможность атаковать сразу.',
            image: '👢',
            color: '#6b7280'
        },
        {
            id: 'amulet',
            name: 'Амулет здоровья',
            type: 'artifact',
            cost: 0,
            requirements: [],
            effect: 'health_buff',
            value: 5,
            rarity: 'rare',
            description: 'Увеличивает максимальное здоровье на 5.',
            image: '📿',
            color: '#059669'
        }
    ],
    
    // Квесты для артефактов
    quests: [
        {
            id: 'summon_creatures',
            type: 'summon',
            requirement: 3,
            description: 'Призовите 3 существ за один ход',
            artifactReward: 'random_common'
        },
        {
            id: 'deal_damage',
            type: 'damage',
            requirement: 10,
            description: 'Нанесите 10 урона за один ход',
            artifactReward: 'random_rare'
        },
        {
            id: 'kill_creatures',
            type: 'kill',
            requirement: 3,
            description: 'Уничтожьте 3 существа за один ход',
            artifactReward: 'random_epic'
        },
        {
            id: 'play_spells',
            type: 'spell',
            requirement: 2,
            description: 'Разыграйте 2 заклинания за один ход',
            artifactReward: 'mage_staff'
        },
        {
            id: 'heal_damage',
            type: 'heal',
            requirement: 8,
            description: 'Исцелите 8 урона за один ход',
            artifactReward: 'amulet'
        }
    ],
    
    // Способности существ
    abilities: {
        taunt: {
            name: 'Провокация',
            description: 'Враг должен атаковать это существо в первую очередь',
            icon: 'fa-shield-alt'
        },
        charge: {
            name: 'Рывок',
            description: 'Может атаковать сразу при выходе на поле',
            icon: 'fa-running'
        },
        flying: {
            name: 'Полет',
            description: 'Может атаковать летающих существ и героя',
            icon: 'fa-dove'
        },
        trample: {
            name: 'Топот',
            description: 'Избыточный урон переходит на героя',
            icon: 'fa-elephant'
        },
        rebirth: {
            name: 'Возрождение',
            description: 'Возвращается в руку после смерти',
            icon: 'fa-redo'
        },
        breath: {
            name: 'Дыхание',
            description: 'Атакует 2 цели одновременно',
            icon: 'fa-fire'
        },
        web: {
            name: 'Паутина',
            description: 'Захватывает цель на 1 ход',
            icon: 'fa-spider-web'
        },
        immune_spells: {
            name: 'Иммунитет',
            description: 'Невосприимчив к заклинаниям',
            icon: 'fa-user-shield'
        },
        undead: {
            name: 'Нежить',
            description: 'Игнорирует отравление и кровотечение',
            icon: 'fa-skull'
        },
        underwater: {
            name: 'Водное',
            description: 'Не может атаковать неводных существ',
            icon: 'fa-water'
        },
        tsunami: {
            name: 'Цунами',
            description: 'Атакует всех существ противника',
            icon: 'fa-wave-square'
        }
    },
    
    // Редкости карт
    rarities: {
        common: {
            name: 'Обычная',
            color: '#6b7280',
            weight: 60
        },
        rare: {
            name: 'Редкая',
            color: '#3b82f6',
            weight: 25
        },
        epic: {
            name: 'Эпическая',
            color: '#8b5cf6',
            weight: 10
        },
        legendary: {
            name: 'Легендарная',
            color: '#f59e0b',
            weight: 5
        }
    },
    
    // Вспомогательные методы
    getCardById: function(id) {
        return [...this.creatureCards, ...this.spellCards].find(card => card.id === id);
    },
    
    getArtifactById: function(id) {
        return this.artifactCards.find(artifact => artifact.id === id);
    },
    
    getAvatarById: function(id) {
        return this.avatars.find(avatar => avatar.id === id);
    },
    
    getRarityColor: function(rarity) {
        return this.rarities[rarity]?.color || '#6b7280';
    },
    
    getRarityName: function(rarity) {
        return this.rarities[rarity]?.name || 'Обычная';
    },
    
    getAbilityDescription: function(abilityId) {
        return this.abilities[abilityId]?.description || '';
    },
    
    getAbilityName: function(abilityId) {
        return this.abilities[abilityId]?.name || abilityId;
    },
    
    getAbilityIcon: function(abilityId) {
        return this.abilities[abilityId]?.icon || 'fa-star';
    },
    
    // Создание колоды
    createDeck: function() {
        const deck = [];
        
        // Добавляем существа
        const creatures = [...this.creatureCards];
        
        // Балансировка колоды по редкости
        const rarityCounts = {
            common: 15,
            rare: 8,
            epic: 5,
            legendary: 2
        };
        
        Object.entries(rarityCounts).forEach(([rarity, count]) => {
            const cardsOfRarity = creatures.filter(card => card.rarity === rarity);
            for (let i = 0; i < count; i++) {
                if (cardsOfRarity.length > 0) {
                    const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
                    deck.push({
                        ...randomCard,
                        instanceId: `${randomCard.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            }
        });
        
        // Добавляем заклинания
        const spells = [...this.spellCards];
        for (let i = 0; i < 5; i++) {
            if (spells.length > 0) {
                const randomSpell = spells[Math.floor(Math.random() * spells.length)];
                deck.push({
                    ...randomSpell,
                    instanceId: `${randomSpell.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
            }
        }
        
        // Перемешиваем колоду
        return this.shuffleArray(deck);
    },
    
    // Создание колоды артефактов для игры
    createArtifactDeck: function(avatar1, avatar2) {
        const deck = [];
        
        // Добавляем стартовые артефакты обоих аватаров
        const avatars = [this.getAvatarById(avatar1), this.getAvatarById(avatar2)];
        
        avatars.forEach(avatar => {
            if (avatar && avatar.startingArtifacts) {
                avatar.startingArtifacts.forEach(artifactId => {
                    const artifact = this.getArtifactById(artifactId);
                    if (artifact) {
                        deck.push({
                            ...artifact,
                            instanceId: `${artifactId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        });
                    }
                });
            }
        });
        
        // Добавляем случайные артефакты до нужного размера
        const needed = this.game.artifactDeckSize - deck.length;
        const allArtifacts = [...this.artifactCards];
        
        for (let i = 0; i < needed; i++) {
            if (allArtifacts.length > 0) {
                const randomArtifact = allArtifacts[Math.floor(Math.random() * allArtifacts.length)];
                deck.push({
                    ...randomArtifact,
                    instanceId: `${randomArtifact.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
            }
        }
        
        return this.shuffleArray(deck);
    },
    
    // Выбор случайного квеста
    getRandomQuest: function() {
        const randomQuest = this.quests[Math.floor(Math.random() * this.quests.length)];
        return {
            ...randomQuest,
            progress: 0,
            completed: false
        };
    },
    
    // Проверка выполнения квеста
    checkQuestProgress: function(quest, action, value) {
        if (quest.completed) return quest;
        
        if (quest.type === action) {
            quest.progress += value;
            
            if (quest.progress >= quest.requirement) {
                quest.completed = true;
                quest.rewardGranted = false;
            }
        }
        
        return quest;
    },
    
    // Получение награды за квест
    getQuestReward: function(quest) {
        if (!quest.completed || quest.rewardGranted) return null;
        
        quest.rewardGranted = true;
        
        if (quest.artifactReward === 'random_common') {
            const commonArtifacts = this.artifactCards.filter(a => a.rarity === 'common');
            return commonArtifacts[Math.floor(Math.random() * commonArtifacts.length)];
        } else if (quest.artifactReward === 'random_rare') {
            const rareArtifacts = this.artifactCards.filter(a => a.rarity === 'rare');
            return rareArtifacts[Math.floor(Math.random() * rareArtifacts.length)];
        } else if (quest.artifactReward === 'random_epic') {
            const epicArtifacts = this.artifactCards.filter(a => a.rarity === 'epic');
            return epicArtifacts[Math.floor(Math.random() * epicArtifacts.length)];
        } else {
            return this.getArtifactById(quest.artifactReward);
        }
    },
    
    // Перемешивание массива
    shuffleArray: function(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}