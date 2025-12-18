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
        cardWidth: 140,
        cardHeight: 200,
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
<<<<<<< Updated upstream
=======
            icon: 'fa-user-warrior',
            color: '#dc2626',
            description: 'Сильный воин, специалист в ближнем бою',
            image: '/assets/images/warrior.jpg',
            bonusHealth: 5,
            bonusMana: 0
        },
        {
            id: 'mage',
            name: 'Маг',
            icon: 'fa-hat-wizard',
            color: '#7c3aed',
            description: 'Могущественный волшебник, владеет магией',
            image: 'https://i.imgur.com/3Q8V7xN.png',
            bonusHealth: -5,
            bonusMana: 3
        },
        {
            id: 'archer',
            name: 'Стрелок',
            icon: 'fa-bow-arrow',
            color: '#059669',
            description: 'Меткий стрелок, атакует издалека',
            image: 'https://i.imgur.com/9KzL8vR.png',
            bonusHealth: 0,
            bonusMana: 1
        },
        {
            id: 'cleric',
            name: 'Жрец',
            icon: 'fa-hands-praying',
            color: '#f59e0b',
            description: 'Святой лекарь, исцеляет союзников',
            image: 'https://i.imgur.com/2X7V3cQ.png',
            bonusHealth: 10,
            bonusMana: 2
        },
        {
            id: 'rogue',
            name: 'Разбойник',
            icon: 'fa-mask',
            color: '#4b5563',
            description: 'Хитрый и скрытный, наносит внезапные удары',
            image: 'https://i.imgur.com/8M4p6qF.png',
            bonusHealth: -3,
            bonusMana: 1
        },
        {
            id: 'knight',
            name: 'Рыцарь',
            icon: 'fa-helmet-battle',
            color: '#3b82f6',
            description: 'Благородный защитник в тяжелых доспехах',
            image: 'https://i.imgur.com/6V9zLqW.png',
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
            image: 'https://i.imgur.com/1L8cX9T.png',
            color: '#6b7280'
        },
        {
            id: 'wolf',
            name: 'Волк',
>>>>>>> Stashed changes
            type: 'creature',
            cost: 2,
            attack: 2,
            health: 4,
            rarity: 'common',
<<<<<<< Updated upstream
            abilities: [],
            description: 'Простой воин, основа армии.',
            image: '👨‍⚖️',
=======
            abilities: ['charge'],
            tags: ['beast', 'quadruped'],
            description: 'Быстрый хищник, атакует сразу при выходе.',
            image: 'https://i.imgur.com/3J9qL8X.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
            abilities: ['undead'],
            tags: ['undead', 'skeleton'],
            description: 'Восставший скелет, не чувствует боли.',
            image: 'https://i.imgur.com/5K8vL9R.png',
            color: '#6b7280'
        },
        {
            id: 'archer',
            name: 'Лучник',
            type: 'creature',
            cost: 2,
            attack: 1,
            health: 3,
            rarity: 'common',
            abilities: ['ranged'],
            tags: ['human', 'ranged', 'has_legs', 'has_arms'],
            description: 'Меткий стрелок, атакует издалека.',
            image: 'https://i.imgur.com/7M2vL9X.png',
            color: '#6b7280'
        },
        {
            id: 'goblin',
            name: 'Гоблин',
            type: 'creature',
            cost: 2,
            attack: 2,
            health: 1,
            rarity: 'common',
            abilities: [],
            tags: ['goblin', 'has_legs', 'has_arms'],
            description: 'Маленький, но злобный гуманоид.',
            image: 'https://i.imgur.com/9L3cX8R.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
            tags: ['human', 'knight', 'has_legs', 'has_arms'],
            description: 'Облаченный в броню защитник.',
            image: 'https://i.imgur.com/2V8cL9X.png',
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
            image: 'https://i.imgur.com/4X9vL8R.png',
            color: '#3b82f6'
        },
        {
            id: 'harpy',
            name: 'Гарпия',
>>>>>>> Stashed changes
            type: 'creature',
            type: 'spell',
            cost: 3,
            attack: 3,
            health: 0,
            rarity: 'rare',
<<<<<<< Updated upstream
            abilities: ['area'],
            description: 'Наносит урон по площади.',
            image: '🔮',
=======
            abilities: ['flying'],
            tags: ['flying', 'bird', 'has_wings'],
            description: 'Крылатое существо, атакует с воздуха.',
            image: 'https://i.imgur.com/6L1cX9T.png',
            color: '#3b82f6'
        },
        {
            id: 'priest',
            name: 'Жрец',
            type: 'creature',
            cost: 3,
            attack: 2,
            health: 3,
            rarity: 'rare',
            abilities: ['heal'],
            tags: ['human', 'priest', 'has_legs', 'has_arms'],
            description: 'Святой лекарь, исцеляет союзников.',
            image: 'https://i.imgur.com/8M3vL9X.png',
            color: '#3b82f6'
        },
        {
            id: 'assassin',
            name: 'Убийца',
            type: 'creature',
            cost: 3,
            attack: 3,
            health: 2,
            rarity: 'rare',
            abilities: ['stealth'],
            tags: ['human', 'assassin', 'has_legs', 'has_arms'],
            description: 'Скрытный убийца, наносит смертельные удары.',
            image: 'https://i.imgur.com/1V9zLqW.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            abilities: ['flying', 'area'],
            description: 'Могучее летающее существо.',
            image: '🐉',
=======
            abilities: ['flying', 'breath'],
            tags: ['dragon', 'flying', 'has_wings', 'has_legs'],
            description: 'Могучее летающее существо, дышащее огнем.',
            image: 'https://i.imgur.com/3X8cL9T.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            abilities: ['stealth', 'poison'],
            description: 'Незаметный убийца с отравленным клинком.',
            image: '🗡️',
=======
            abilities: ['web'],
            tags: ['spider', 'arachnid', 'many_legs'],
            description: 'Огромный паук, опутывающий врагов паутиной.',
            image: 'https://i.imgur.com/5V9zL8R.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            abilities: ['taunt', 'healer', 'shield'],
            description: 'Святой воин, защищающий союзников.',
            image: '✝️',
=======
            abilities: ['immune_spells'],
            tags: ['elemental', 'magical'],
            description: 'Существо чистой магии, невосприимчиво к заклинаниям.',
            image: 'https://i.imgur.com/7L2vL9X.png',
            color: '#8b5cf6'
        },
        {
            id: 'behemoth',
            name: 'Бегемот',
            type: 'creature',
            cost: 7,
            attack: 5,
            health: 7,
            rarity: 'epic',
            abilities: ['trample', 'armor'],
            tags: ['beast', 'giant', 'has_legs'],
            description: 'Монстр с толстой шкурой, проходящий сквозь ряды врагов.',
            image: 'https://i.imgur.com/9X8cL9R.png',
            color: '#8b5cf6'
        },
        {
            id: 'archmage',
            name: 'Архимаг',
            type: 'creature',
            cost: 6,
            attack: 3,
            health: 5,
            rarity: 'epic',
            abilities: ['spell_power'],
            tags: ['human', 'mage', 'has_legs', 'has_arms'],
            description: 'Верховный маг, усиливающий заклинания.',
            image: 'https://i.imgur.com/2L9qL8X.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            description: 'Возрождается после смерти с полным здоровьем.',
            image: '🦅',
=======
            tags: ['bird', 'flying', 'has_wings', 'mythical'],
            description: 'Легендарная птица, возрождающаяся из пепла.',
            image: 'https://i.imgur.com/4X9vL8T.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            abilities: ['taunt', 'breakthrough', 'shield'],
            description: 'Древний гигант, непробиваемая защита.',
            image: '🗿',
=======
            abilities: ['trample', 'immune_spells'],
            tags: ['giant', 'titan', 'has_legs', 'has_arms', 'mythical'],
            description: 'Древний гигант, непробиваемая мощь.',
            image: 'https://i.imgur.com/6V8cL9X.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            abilities: ['summon', 'poison'],
            description: 'Призывает павших воинов обратно в бой.',
            image: '☠️',
=======
            abilities: ['underwater', 'tsunami'],
            tags: ['sea', 'leviathan', 'aquatic', 'mythical'],
            description: 'Морское чудовище, вызывающее цунами.',
            image: 'https://i.imgur.com/8L3cX9R.png',
            color: '#f59e0b'
        },
        {
            id: 'angel',
            name: 'Ангел',
            type: 'creature',
            cost: 8,
            attack: 4,
            health: 8,
            rarity: 'legendary',
            abilities: ['flying', 'heal', 'divine'],
            tags: ['angel', 'flying', 'has_wings', 'divine'],
            description: 'Небесный защитник, исцеляющий и охраняющий.',
            image: 'https://i.imgur.com/1V9qL8X.png',
            color: '#f59e0b'
        },
        {
            id: 'demon_lord',
            name: 'Повелитель Демонов',
            type: 'creature',
            cost: 9,
            attack: 7,
            health: 7,
            rarity: 'legendary',
            abilities: ['flying', 'fire_breath', 'fear'],
            tags: ['demon', 'flying', 'has_wings', 'has_legs', 'evil'],
            description: 'Владыка демонов, сеющий страх и разрушение.',
            image: 'https://i.imgur.com/3X8vL9R.png',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            color: '#f59e0b'
        }
    ],
    
<<<<<<< Updated upstream
    // Способности карт
=======
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
            image: 'https://i.imgur.com/5G6bX9W.png',
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
            image: 'https://i.imgur.com/3Q8V7xN.png',
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
            image: 'https://i.imgur.com/9KzL8vR.png',
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
            description: 'Замораживает всех сущест противника на 1 ход.',
            image: 'https://i.imgur.com/2X7V3cQ.png',
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
            image: 'https://i.imgur.com/8M4p6qF.png',
            color: '#f59e0b'
        },
        {
            id: 'divine_shield',
            name: 'Божественный Щит',
            type: 'spell',
            cost: 3,
            effect: 'shield',
            value: 3,
            rarity: 'common',
            description: 'Дает 3 брони цели.',
            image: 'https://i.imgur.com/6V9zLqW.png',
            color: '#f59e0b'
        },
        {
            id: 'berserk',
            name: 'Берсерк',
            type: 'spell',
            cost: 4,
            effect: 'buff',
            value: 3,
            rarity: 'rare',
            description: 'Увеличивает атаку цели на 3 до конца хода.',
            image: 'https://i.imgur.com/5G6bX9W.png',
            color: '#dc2626'
        },
        {
            id: 'mass_heal',
            name: 'Массовое Исцеление',
            type: 'spell',
            cost: 6,
            effect: 'mass_heal',
            value: 3,
            rarity: 'epic',
            description: 'Исцеляет всех ваших существ на 3 здоровья.',
            image: 'https://i.imgur.com/3Q8V7xN.png',
            color: '#059669'
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
            image: 'https://i.imgur.com/9KzL8vR.png',
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
            image: 'https://i.imgur.com/2X7V3cQ.png',
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
            image: 'https://i.imgur.com/8M4p6qF.png',
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
            image: 'https://i.imgur.com/6V9zLqW.png',
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
            image: 'https://i.imgur.com/5G6bX9W.png',
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
            image: 'https://i.imgur.com/3Q8V7xN.png',
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
            image: 'https://i.imgur.com/9KzL8vR.png',
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
            image: 'https://i.imgur.com/2X7V3cQ.png',
            color: '#059669'
        },
        {
            id: 'crown',
            name: 'Корона Короля',
            type: 'artifact',
            cost: 0,
            requirements: ['human'],
            effect: 'royal_aura',
            value: 2,
            rarity: 'legendary',
            description: 'Увеличивает атаку и здоровье всех ваших существ на 2.',
            image: 'https://i.imgur.com/8M4p6qF.png',
            color: '#f59e0b'
        },
        {
            id: 'tome',
            name: 'Том Знаний',
            type: 'artifact',
            cost: 0,
            requirements: [],
            effect: 'draw_cards',
            value: 2,
            rarity: 'rare',
            description: 'Позволяет взять 2 дополнительные карты.',
            image: 'https://i.imgur.com/6V9zLqW.png',
            color: '#7c3aed'
        }
    ],
    
    // Квесты для артефактов (исправлено - теперь отдельные для каждого игрока)
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
        },
        {
            id: 'control_board',
            type: 'board',
            requirement: 5,
            description: 'Контролируйте 5 существ на поле',
            artifactReward: 'random_rare'
        },
        {
            id: 'use_artifacts',
            type: 'artifact',
            requirement: 3,
            description: 'Используйте 3 артефакта за игру',
            artifactReward: 'random_epic'
        },
        {
            id: 'survive_damage',
            type: 'survive',
            requirement: 15,
            description: 'Выживите, получив 15 урона за игру',
            artifactReward: 'plate_armor'
        }
    ],
    
    // Способности существ
>>>>>>> Stashed changes
    abilities: {
        taunt: {
            name: 'Провокация',
            description: 'Противник должен атаковать это существо в первую очередь',
            costModifier: 1
        },
<<<<<<< Updated upstream
        breakthrough: {
            name: 'Прорыв',
            description: 'Наносит урон дважды (второй удар без контратаки)',
            costModifier: 1
        },
        stealth: {
            name: 'Скрытность',
            description: 'Не может быть целью атаки, пока не атакует сам',
            costModifier: 1
=======
        charge: {
            name: 'Рывок',
            description: 'Может атаковать сразу при выходе на поле (ячейка 1)',
            icon: 'fa-running'
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        summon: {
            name: 'Призыв',
            description: 'Призывает случайное существо при входе в игру',
            costModifier: 3
=======
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
        },
        ranged: {
            name: 'Дальний бой',
            description: 'Может атаковать через ряд',
            icon: 'fa-crosshairs'
        },
        stealth: {
            name: 'Скрытность',
            description: 'Не может быть атакован пока сам не атакует (ячейка 5)',
            icon: 'fa-eye-slash'
        },
        heal: {
            name: 'Исцеление',
            description: 'Может исцелять союзников',
            icon: 'fa-heart'
        },
        spell_power: {
            name: 'Магическая сила',
            description: 'Усиливает ваши заклинания',
            icon: 'fa-magic'
        },
        armor: {
            name: 'Броня',
            description: 'Уменьшает получаемый урон',
            icon: 'fa-shield'
        },
        divine: {
            name: 'Божественность',
            description: 'Исцеляет союзников при атаке',
            icon: 'fa-star'
        },
        fire_breath: {
            name: 'Огненное дыхание',
            description: 'Наносит урон всем врагам в ряду',
            icon: 'fa-fire-alt'
        },
        fear: {
            name: 'Страх',
            description: 'Заставляет врагов пропускать ход',
            icon: 'fa-ghost'
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
    
<<<<<<< Updated upstream
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
=======
    // Создание колоды артефактов для игры
    createArtifactDeck: function(avatar1, avatar2) {
        const deck = [];
        const allArtifacts = [...this.artifactCards];
        
        // Добавляем случайные артефакты до нужного размера
        for (let i = 0; i < this.game.artifactDeckSize; i++) {
            if (allArtifacts.length > 0) {
                const randomArtifact = allArtifacts[Math.floor(Math.random() * allArtifacts.length)];
                deck.push({
                    ...randomArtifact,
                    instanceId: `${randomArtifact.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
>>>>>>> Stashed changes
            }
            random -= rarity.weight;
        }
        
        return this.cards[0]; // Fallback
    },
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Перемешать массив
=======
=======
>>>>>>> Stashed changes
    // Выбор случайного квеста для игрока
    getRandomQuest: function() {
        const randomQuest = this.quests[Math.floor(Math.random() * this.quests.length)];
        return {
            ...randomQuest,
            progress: 0,
            completed: false,
            rewardGranted: false,
            playerId: null // Будет установлено при создании игры
        };
    },
    
    // Проверка выполнения квеста
    checkQuestProgress: function(quest, action, value, playerId) {
        if (quest.completed || quest.playerId !== playerId) return quest;
        
        if (quest.type === action) {
            quest.progress += value;
            
            if (quest.progress >= quest.requirement && !quest.completed) {
                quest.completed = true;
                quest.rewardGranted = false;
                // Награда будет выдана только при проверке в конце хода
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
>>>>>>> Stashed changes
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