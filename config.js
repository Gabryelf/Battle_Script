const GameConfig = {
    game: {
        maxPlayers: 2,
        maxSpectators: 20,
        turnDuration: 120,
        startingHealth: 30,
        startingMana: 3,
        maxMana: 10,
        maxHandSize: 10,
        deckSize: 30,
        initialHandSize: 3,
        cardsPerTurn: 1,
        drawCardCost: 1,
        extraDrawCost: 0.5,
        artifactDeckSize: 10
    },
    
    server: {
        port: 3000,
        reconnectDelay: 3000,
        heartbeatInterval: 30000,
        inactiveTimeout: 300000
    },
    
    ui: {
        cardWidth: 160,
        cardHeight: 220,
        cardScaleMobile: 0.8,
        animationDuration: 300,
        maxLogEntries: 100,
        maxChatMessages: 50
    },
    
    sounds: {
        enabled: false, // Отключаем звуки, так как они не работают
        volume: 0.5
    },
    
    avatars: [
        {
            id: 'warrior',
            name: 'Воин',
            icon: 'fa-user-warrior',
            color: '#dc2626',
            description: 'Сильный воин, специалист в ближнем бою',
            image: './assets/avatars/warrior.jpg',
            bonusHealth: 5,
            bonusMana: 0,
            spellPower: 0
        },
        {
            id: 'mage',
            name: 'Маг',
            icon: 'fa-hat-wizard',
            color: '#7c3aed',
            description: 'Могущественный волшебник, владеет магией',
            image: './assets/avatars/mage.jpg',
            bonusHealth: -5,
            bonusMana: 3,
            spellPower: 2
        },
        {
            id: 'archer',
            name: 'Стрелок',
            icon: 'fa-bow-arrow',
            color: '#059669',
            description: 'Меткий стрелок, атакует издалека',
            image: './assets/avatars/archer.jpg',
            bonusHealth: 0,
            bonusMana: 1,
            spellPower: 0
        },
        {
            id: 'cleric',
            name: 'Жрец',
            icon: 'fa-hands-praying',
            color: '#f59e0b',
            description: 'Святой лекарь, исцеляет союзников',
            image: './assets/avatars/cleric.jpg',
            bonusHealth: 10,
            bonusMana: 2,
            spellPower: 1
        },
        {
            id: 'rogue',
            name: 'Разбойник',
            icon: 'fa-mask',
            color: '#4b5563',
            description: 'Хитрый и скрытный, наносит внезапные удары',
            image: './assets/avatars/rogue.jpg',
            bonusHealth: -3,
            bonusMana: 1,
            spellPower: 0
        },
        {
            id: 'knight',
            name: 'Рыцарь',
            icon: 'fa-helmet-battle',
            color: '#3b82f6',
            description: 'Благородный защитник в тяжелых доспехах',
            image: './assets/avatars/knight.jpg',
            bonusHealth: 15,
            bonusMana: -2,
            spellPower: 0
        }
    ],
    
    creatureCards: [
        {
            id: 'footman',
            name: 'Пехотинец',
            type: 'creature',
            cost: 1,
            attack: 1,
            health: 2,
            rarity: 'common',
            abilities: [],
            tags: ['human', 'warrior'],
            description: 'Простой пехотинец, основа любой армии.',
            image: './assets/images/warrior.jpg',
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
            tags: ['beast'],
            description: 'Быстрый хищник, атакует сразу при выходе.',
            image: './assets/images/wolf.jpg',
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
            tags: ['undead'],
            description: 'Восставший скелет, не чувствует боли.',
            image: './assets/images/skeleton.jpg',
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
            tags: ['human', 'ranged'],
            description: 'Меткий стрелок, атакует издалека.',
            image: './assets/images/archer_unit.jpg',
            color: '#6b7280'
        },
        {
            id: 'knight',
            name: 'Рыцарь',
            type: 'creature',
            cost: 4,
            attack: 3,
            health: 5,
            rarity: 'rare',
            abilities: ['taunt'],
            tags: ['human', 'knight'],
            description: 'Облаченный в броню защитник.',
            image: './assets/images/knight_unit.jpg',
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
            tags: ['giant'],
            description: 'Огромное существо, проходящее сквозь врагов.',
            image: './assets/images/ogre.jpg',
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
            tags: ['flying', 'bird'],
            description: 'Крылатое существо, атакует с воздуха.',
            image: './assets/images/harpy.jpg',
            color: '#3b82f6'
        },
        {
            id: 'dragon',
            name: 'Дракон',
            type: 'creature',
            cost: 8,
            attack: 6,
            health: 6,
            rarity: 'epic',
            abilities: ['flying', 'breath'],
            tags: ['dragon', 'flying'],
            description: 'Могучее летающее существо, дышащее огнем.',
            image: './assets/images/dragon.jpg',
            color: '#8b5cf6'
        },
        {
            id: 'phoenix',
            name: 'Феникс',
            type: 'creature',
            cost: 9,
            attack: 5,
            health: 5,
            rarity: 'legendary',
            abilities: ['flying', 'rebirth'],
            tags: ['bird', 'flying', 'mythical'],
            description: 'Легендарная птица, возрождающаяся из пепла.',
            image: './assets/images/phoenix.jpg',
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
            tags: ['giant', 'titan', 'mythical'],
            description: 'Древний гигант, непробиваемая мощь.',
            image: './assets/images/titan.jpg',
            color: '#f59e0b'
        }
    ],
    
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
            image: './assets/images/spell/fireball.jpg',
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
            image: './assets/images/spell/heal.jpg',
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
            image: './assets/images/spell/lightning.jpg',
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
            image: './assets/images/spell/frost_nova.jpg',
            color: '#3b82f6'
        }
    ],
    
    artifactCards: [
        {
            id: 'warrior_sword',
            name: 'Меч воина',
            type: 'artifact',
            cost: 0,
            requirements: ['summon_creatures', 1],
            effect: 'attack_buff',
            value: 2,
            rarity: 'common',
            description: 'Меч, увеличивающий атаку героя на 2.',
            image: './assets/images/artifact/warrior_sword.jpg',
            color: '#6b7280'
        },
        {
            id: 'warrior_shield',
            name: 'Щит воина',
            type: 'artifact',
            cost: 0,
            requirements: ['deal_damage', 1],
            effect: 'health_buff',
            value: 5,
            rarity: 'common',
            description: 'Щит, увеличивающий здоровье героя на 5.',
            image: './assets/images/artifact/warrior_shield.jpg',
            color: '#6b7280'
        },
        {
            id: 'mage_staff',
            name: 'Посох мага',
            type: 'artifact',
            cost: 0,
            requirements: ['kill_creatures', 1],
            effect: 'spell_power',
            value: 3,
            rarity: 'rare',
            description: 'Увеличивает силу заклинаний на 3.',
            image: './assets/images/artifact/mage_staff.jpg',
            color: '#7c3aed'
        },
        {
            id: 'crown',
            name: 'Корона Короля',
            type: 'artifact',
            cost: 0,
            requirements: ['play_spells', 1],
            effect: 'royal_aura',
            value: 2,
            rarity: 'legendary',
            description: 'Увеличивает атаку и здоровье всех ваших существ на 2.',
            image: './assets/images/artifact/crown.jpg',
            color: '#f59e0b'
        }
    ],
    
    quests: [
        {
            id: 'summon_creatures',
            type: 'summon',
            requirement: 1,
            description: 'Призовите 1 существо',
            artifactReward: 'warrior_sword'
        },
        {
            id: 'deal_damage',
            type: 'damage',
            requirement: 1,
            description: 'Нанесите 1 урона',
            artifactReward: 'warrior_shield'
        },
        {
            id: 'kill_creatures',
            type: 'kill',
            requirement: 1,
            description: 'Уничтожьте 1 существо',
            artifactReward: 'mage_staff'
        },
        {
            id: 'play_spells',
            type: 'spell',
            requirement: 1,
            description: 'Разыграйте 1 заклинание',
            artifactReward: 'crown'
        },
        {
            id: 'use_artifacts',
            type: 'artifact',
            requirement: 1,
            description: 'Используйте 1 артефакт',
            artifactReward: 'random_epic'
        }
    ],
    
    abilities: {
        taunt: {
            name: 'Провокация',
            description: 'Противник должен атаковать это существо в первую очередь',
            costModifier: 1
        },
        charge: {
            name: 'Рывок',
            description: 'Может атаковать сразу при выходе на поле',
            icon: 'fa-running'
        },
        flying: {
            name: 'Полет',
            description: 'Может атаковать только летающих существ или героя',
            costModifier: 1
        },
        ranged: {
            name: 'Дальний бой',
            description: 'Может атаковать через ряд',
            icon: 'fa-crosshairs'
        },
        stealth: {
            name: 'Скрытность',
            description: 'Не может быть атакован пока сам не атакует',
            icon: 'fa-eye-slash'
        },
        undead: {
            name: 'Нежить',
            description: 'Игнорирует отравление и кровотечение',
            icon: 'fa-skull'
        },
        trample: {
            name: 'Топот',
            description: 'Избыточный урон переносится на героя',
            icon: 'fa-elephant'
        },
        breath: {
            name: 'Дыхание',
            description: 'Атакует 2 цели одновременно',
            icon: 'fa-fire'
        },
        rebirth: {
            name: 'Возрождение',
            description: 'Возвращается в руку после смерти',
            costModifier: 3
        },
        immune_spells: {
            name: 'Иммунитет',
            description: 'Невосприимчив к заклинаниям',
            icon: 'fa-user-shield'
        }
    },
    
    rarities: {
        common: {
            name: 'Обычная',
            color: '#6b7280',
            weight: 60,
            maxCopies: 3
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
    
    getAvatarById(id) {
        return this.avatars.find(avatar => avatar.id === id) || this.avatars[0];
    },
    
    getCardById(id) {
        return [...this.creatureCards, ...this.spellCards].find(card => card.id === id);
    },
    
    getArtifactById(id) {
        return this.artifactCards.find(artifact => artifact.id === id);
    },
    
    createDeck() {
        const allCards = [...this.creatureCards, ...this.spellCards];
        const deck = [];
        
        // Добавляем карты по редкости
        for (const [rarityId, rarity] of Object.entries(this.rarities)) {
            const cardsOfRarity = allCards.filter(card => card.rarity === rarityId);
            const count = Math.floor(this.game.deckSize * (rarity.weight / 100));
            
            for (let i = 0; i < count && cardsOfRarity.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
                deck.push({...cardsOfRarity[randomIndex]});
            }
        }
        
        // Дополняем до нужного размера
        while (deck.length < this.game.deckSize && allCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * allCards.length);
            deck.push({...allCards[randomIndex]});
        }
        
        // Обрезаем до нужного размера
        deck.length = Math.min(deck.length, this.game.deckSize);
        
        return this.shuffleArray(deck);
    },
    
    createArtifactDeck() {
        const deck = [];
        
        for (let i = 0; i < this.game.artifactDeckSize && this.artifactCards.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * this.artifactCards.length);
            deck.push({...this.artifactCards[randomIndex]});
        }
        
        return this.shuffleArray(deck);
    },
    
    getRandomQuest() {
        const randomQuest = JSON.parse(JSON.stringify(
            this.quests[Math.floor(Math.random() * this.quests.length)]
        ));
        
        return {
            ...randomQuest,
            progress: 0,
            completed: false,
            rewardGranted: false
        };
    },
    
    getQuestReward(quest) {
        if (quest.artifactReward === 'random_epic') {
            const epicArtifacts = this.artifactCards.filter(a => a.rarity === 'epic');
            return epicArtifacts[Math.floor(Math.random() * epicArtifacts.length)];
        }
        
        return this.getArtifactById(quest.artifactReward);
    },
    
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    validateDeck(deck) {
        if (!deck || !Array.isArray(deck)) return false;
        if (deck.length < this.game.deckSize * 0.8) return false;
        
        const cardCounts = {};
        deck.forEach(card => {
            cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
        });
        
        for (const [cardId, count] of Object.entries(cardCounts)) {
            const card = this.getCardById(cardId);
            if (card) {
                const maxCopies = this.rarities[card.rarity].maxCopies;
                if (count > maxCopies) return false;
            }
        }
        
        return true;
    },
    
    getRarityColor(rarity) {
        return this.rarities[rarity]?.color || '#6b7280';
    },
    
    getRarityName(rarity) {
        return this.rarities[rarity]?.name || 'Обычная';
    },
    
    getAbilityDescription(abilityId) {
        return this.abilities[abilityId]?.description || '';
    },
    
    getAbilityName(abilityId) {
        return this.abilities[abilityId]?.name || abilityId;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}