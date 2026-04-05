(() => {
    const STARTING_STACK = 1500;
    const SMALL_BLIND = 10;
    const BIG_BLIND = 20;
    const SUITS = [
        { key: 's', symbol: '♠', color: 'black' },
        { key: 'h', symbol: '♥', color: 'red' },
        { key: 'd', symbol: '♦', color: 'red' },
        { key: 'c', symbol: '♣', color: 'black' }
    ];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const STREET_LABELS = {
        preflop: 'Pre-Flop',
        flop: 'Flop',
        turn: 'Turn',
        river: 'River',
        showdown: 'Showdown'
    };
    const YUI_LINES = {
        intro: [
            'Юи выравнивает колоду по краю стола. Кажется, она уже заметила твой первый микрожест.',
            'Она улыбается едва заметно. Слишком спокойно для обычной школьницы за карточным столом.',
            'Красная лента не дрожит. Значит, нервничать она точно не собирается.'
        ],
        think: [
            'Слишком ровное дыхание. Ты, наверное, стараешься не показать лишнего.',
            'Иногда пауза говорит о руке больше, чем сама ставка.',
            'Если позволишь, я ещё немного посмотрю, как ты выбираешь решения.'
        ],
        pressure: [
            'Небольшое давление. Просто чтобы проверить, насколько честен твой ритм.',
            'Я подниму ставку. Не из жестокости, а из любопытства.',
            'Давай посмотрим, выдержит ли твой покерфейс ещё один шаг.'
        ],
        call: [
            'Колл. Этого пока достаточно.',
            'Я останусь в раздаче. Информации ещё недостаточно.',
            'Пожалуй, я досмотрю эту линию до конца.'
        ],
        check: [
            'Чек. Иногда тишина полезнее лишнего движения.',
            'Я не тороплюсь. Стол ещё не рассказал всё.',
            'Пока без давления. Хочу увидеть ещё одну карту.'
        ],
        fold: [
            'Ладно. Этот банк останется за тобой.',
            'Иногда лучше отпустить раздачу, чем спорить с вероятностью.',
            'Хорошо. В этот раз ты меня переиграл.'
        ],
        win: [
            'Спасибо. Это была красивая информация.',
            'Ты сыграл достойно. Просто мне хватило одной детали больше.',
            'Раздача закончилась так, как и подсказывал темп твоих решений.'
        ],
        lose: [
            'Хорошая линия. Мне стоит это запомнить.',
            'Признаю, это было сильно.',
            'Похоже, в этот раз ты оказался терпеливее меня.'
        ],
        showdown: [
            'Теперь можно говорить картами.',
            'На вскрытии всё становится удивительно честным.',
            'Давай проверим, кто из нас вернее прочитал эту раздачу.'
        ]
    };

    function initPokerWidget() {
        const root = document.getElementById('poker-widget');
        if (!root) return;

        const ui = {
            newHandBtn: document.getElementById('poker-new-hand'),
            matchStatus: document.getElementById('poker-match-status'),
            roundLabel: document.getElementById('poker-round-label'),
            yuiLine: document.getElementById('poker-yui-line'),
            yuiAvatar: document.getElementById('poker-yui-avatar'),
            potValue: document.getElementById('poker-pot-value'),
            streetBadge: document.getElementById('poker-street-badge'),
            community: document.getElementById('poker-community-cards'),
            aiSeat: document.getElementById('poker-ai-seat'),
            aiDealer: document.getElementById('poker-ai-dealer'),
            aiStack: document.getElementById('poker-ai-stack'),
            aiBet: document.getElementById('poker-ai-bet'),
            aiHandRank: document.getElementById('poker-ai-hand-rank'),
            aiHand: document.getElementById('poker-ai-hand'),
            playerSeat: document.getElementById('poker-player-seat'),
            playerDealer: document.getElementById('poker-player-dealer'),
            playerStack: document.getElementById('poker-player-stack'),
            playerBet: document.getElementById('poker-player-bet'),
            playerHandRank: document.getElementById('poker-player-hand-rank'),
            playerHand: document.getElementById('poker-player-hand'),
            foldBtn: document.getElementById('poker-fold-btn'),
            callBtn: document.getElementById('poker-call-btn'),
            raiseBtn: document.getElementById('poker-raise-btn'),
            raiseSlider: document.getElementById('poker-raise-slider'),
            raiseReadout: document.getElementById('poker-raise-readout'),
            log: document.getElementById('poker-log')
        };

        if (ui.yuiAvatar) {
            ui.yuiAvatar.src = 'img/gallery/Yui Poker.jpg';
        }

        const state = {
            deck: [],
            community: [],
            pot: 0,
            currentBet: 0,
            minRaise: BIG_BLIND,
            handNumber: 0,
            dealer: 'human',
            acting: null,
            street: 'preflop',
            pendingPlayers: new Set(),
            handOver: true,
            revealAiCards: false,
            aiThinking: false,
            players: createPlayers(),
            stats: {
                human: { hands: 0, raises: 0, calls: 0, folds: 0, vpip: 0 },
                ai: { hands: 0, raises: 0, calls: 0, folds: 0, vpip: 0 }
            }
        };

        function createPlayers() {
            return {
                human: createPlayerState('Ты'),
                ai: createPlayerState('Юи')
            };
        }

        function createPlayerState(label) {
            return {
                label,
                stack: STARTING_STACK,
                hand: [],
                currentBet: 0,
                folded: false,
                allIn: false
            };
        }

        function randomItem(items) {
            return items[Math.floor(Math.random() * items.length)];
        }

        function setYuiLine(bucket, fallback) {
            if (!ui.yuiLine) return;
            const text = YUI_LINES[bucket]?.length ? randomItem(YUI_LINES[bucket]) : fallback;
            ui.yuiLine.textContent = text || '';
        }

        function toast(message, color) {
            if (typeof window.showLoFiToast === 'function') {
                window.showLoFiToast(message, color);
            }
        }

        function logAction(text, tone = 'system') {
            if (!ui.log) return;
            const row = document.createElement('div');
            row.className = `poker-log-entry ${tone}`;
            row.textContent = text;
            ui.log.prepend(row);
            while (ui.log.children.length > 12) {
                ui.log.removeChild(ui.log.lastElementChild);
            }
        }

        function formatChips(value) {
            return new Intl.NumberFormat('ru-RU').format(value);
        }

        function buildDeck() {
            const deck = [];
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    deck.push({
                        rank,
                        suit: suit.key,
                        suitSymbol: suit.symbol,
                        color: suit.color,
                        value: rankToValue(rank),
                        code: `${rank}${suit.key}`
                    });
                }
            }
            return deck;
        }

        function rankToValue(rank) {
            if (rank === 'A') return 14;
            if (rank === 'K') return 13;
            if (rank === 'Q') return 12;
            if (rank === 'J') return 11;
            if (rank === 'T') return 10;
            return Number(rank);
        }

        function shuffle(deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            return deck;
        }

        function drawCard() {
            return state.deck.pop();
        }

        function otherPlayer(id) {
            return id === 'human' ? 'ai' : 'human';
        }

        function activePlayers() {
            return ['human', 'ai'].filter((id) => !state.players[id].folded);
        }

        function playersWhoCanAct() {
            return activePlayers().filter((id) => !state.players[id].allIn);
        }

        function clearPlayerRoundState() {
            for (const id of ['human', 'ai']) {
                state.players[id].currentBet = 0;
            }
        }

        function postBlind(id, amount) {
            const player = state.players[id];
            const blind = Math.min(amount, player.stack);
            player.stack -= blind;
            player.currentBet += blind;
            player.allIn = player.stack === 0;
            state.pot += blind;
            state.currentBet = Math.max(state.currentBet, player.currentBet);
        }

        function rankDisplay(rank) {
            return rank === 'T' ? '10' : rank;
        }

        function createCardElement(card, hidden = false) {
            const node = document.createElement('div');
            node.className = `poker-card ${hidden ? 'poker-card-back' : card.color}`;

            if (hidden) {
                return node;
            }

            node.innerHTML = `
                <div class="poker-card-corner top">
                    <span>${rankDisplay(card.rank)}</span>
                    <span>${card.suitSymbol}</span>
                </div>
                <div class="poker-card-center">${card.suitSymbol}</div>
                <div class="poker-card-corner bottom">
                    <span>${rankDisplay(card.rank)}</span>
                    <span>${card.suitSymbol}</span>
                </div>
            `;

            return node;
        }

        function createPlaceholderCard() {
            const node = document.createElement('div');
            node.className = 'poker-card poker-card-back';
            node.style.opacity = '0.35';
            return node;
        }

        function renderCards(container, cards, options = {}) {
            if (!container) return;
            const { hidden = false, placeholderCount = 0 } = options;
            container.innerHTML = '';

            if (cards.length === 0 && placeholderCount) {
                for (let i = 0; i < placeholderCount; i++) {
                    container.appendChild(createPlaceholderCard());
                }
                return;
            }

            cards.forEach((card) => {
                container.appendChild(createCardElement(card, hidden));
            });

            if (placeholderCount > cards.length) {
                for (let i = cards.length; i < placeholderCount; i++) {
                    container.appendChild(createPlaceholderCard());
                }
            }
        }

        function compareScoreArrays(a, b) {
            for (let i = 0; i < Math.max(a.length, b.length); i++) {
                const left = a[i] || 0;
                const right = b[i] || 0;
                if (left !== right) return left - right;
            }
            return 0;
        }

        function detectStraight(values) {
            const unique = [...new Set(values)].sort((a, b) => b - a);
            if (unique.includes(14)) unique.push(1);

            let run = 1;
            for (let i = 0; i < unique.length - 1; i++) {
                if (unique[i] - 1 === unique[i + 1]) {
                    run += 1;
                    if (run >= 5) {
                        return unique[i - 3];
                    }
                } else {
                    run = 1;
                }
            }

            return null;
        }

        function handName(category, straightHigh = null) {
            if (category === 8) return straightHigh === 14 ? 'Флеш-рояль' : 'Стрит-флеш';
            if (category === 7) return 'Каре';
            if (category === 6) return 'Фулл-хаус';
            if (category === 5) return 'Флеш';
            if (category === 4) return 'Стрит';
            if (category === 3) return 'Сет';
            if (category === 2) return 'Две пары';
            if (category === 1) return 'Пара';
            return 'Старшая карта';
        }

        function evaluateFiveCardHand(cards) {
            const values = cards.map((card) => card.value).sort((a, b) => b - a);
            const suits = cards.map((card) => card.suit);
            const counts = new Map();
            values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

            const groups = [...counts.entries()]
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => b.count - a.count || b.value - a.value);

            const isFlush = suits.every((suit) => suit === suits[0]);
            const straightHigh = detectStraight(values);

            if (isFlush && straightHigh) return { score: [8, straightHigh], name: handName(8, straightHigh) };

            if (groups[0].count === 4) {
                const kicker = groups.find((group) => group.count === 1).value;
                return { score: [7, groups[0].value, kicker], name: handName(7) };
            }

            if (groups[0].count === 3 && groups[1]?.count === 2) {
                return { score: [6, groups[0].value, groups[1].value], name: handName(6) };
            }

            if (isFlush) return { score: [5, ...values], name: handName(5) };
            if (straightHigh) return { score: [4, straightHigh], name: handName(4) };

            if (groups[0].count === 3) {
                const kickers = groups.filter((group) => group.count === 1).map((group) => group.value).sort((a, b) => b - a);
                return { score: [3, groups[0].value, ...kickers], name: handName(3) };
            }

            if (groups[0].count === 2 && groups[1]?.count === 2) {
                const pairValues = groups.filter((group) => group.count === 2).map((group) => group.value).sort((a, b) => b - a);
                const kicker = groups.find((group) => group.count === 1).value;
                return { score: [2, pairValues[0], pairValues[1], kicker], name: handName(2) };
            }

            if (groups[0].count === 2) {
                const kickers = groups.filter((group) => group.count === 1).map((group) => group.value).sort((a, b) => b - a);
                return { score: [1, groups[0].value, ...kickers], name: handName(1) };
            }

            return { score: [0, ...values], name: handName(0) };
        }

        function evaluateBestHand(cards) {
            let best = null;
            for (let a = 0; a < cards.length - 4; a++) {
                for (let b = a + 1; b < cards.length - 3; b++) {
                    for (let c = b + 1; c < cards.length - 2; c++) {
                        for (let d = c + 1; d < cards.length - 1; d++) {
                            for (let e = d + 1; e < cards.length; e++) {
                                const evaluated = evaluateFiveCardHand([cards[a], cards[b], cards[c], cards[d], cards[e]]);
                                if (!best || compareScoreArrays(evaluated.score, best.score) > 0) {
                                    best = evaluated;
                                }
                            }
                        }
                    }
                }
            }
            return best;
        }

        function estimateWinProbability(heroHand, community, villainKnown = [], simulations = 220) {
            const used = new Set([...heroHand, ...community, ...villainKnown].map((card) => card.code));
            let wins = 0;

            for (let i = 0; i < simulations; i++) {
                const deck = shuffle(buildDeck().filter((card) => !used.has(card.code)));
                const villainHand = villainKnown.length ? villainKnown : [deck.pop(), deck.pop()];
                const board = [...community];
                while (board.length < 5) board.push(deck.pop());

                const heroBest = evaluateBestHand([...heroHand, ...board]);
                const villainBest = evaluateBestHand([...villainHand, ...board]);
                const comparison = compareScoreArrays(heroBest.score, villainBest.score);

                if (comparison > 0) wins += 1;
                if (comparison === 0) wins += 0.5;
            }

            return wins / simulations;
        }

        function preflopStrength(hand) {
            const [first, second] = hand.slice().sort((a, b) => b.value - a.value);
            const suited = first.suit === second.suit;
            const gap = Math.abs(first.value - second.value);
            let strength = 0.16 + (first.value + second.value) / 34;

            if (first.value === second.value) {
                strength = 0.44 + first.value / 20;
            } else {
                if (first.value >= 13 && second.value >= 10) strength += 0.12;
                if (suited) strength += 0.05;
                if (gap === 1) strength += 0.05;
                if (gap === 2) strength += 0.02;
                if (first.value === 14 && second.value >= 10) strength += 0.06;
            }

            return Math.max(0.08, Math.min(0.97, strength));
        }

        function describeHoleCards(hand) {
            const [first, second] = hand.slice().sort((a, b) => b.value - a.value);
            const suited = first.suit === second.suit;
            const gap = Math.abs(first.value - second.value);

            if (first.value === second.value) return `Карманная пара ${rankDisplay(first.rank)}`;
            if (suited && gap === 1) return 'Одномастные коннекторы';
            if (first.value >= 13 && second.value >= 11) return 'Премиум-бродвеи';
            if (suited) return 'Одномастная рука';
            return 'Стартовая рука';
        }

        function getPlayerBestHand(id) {
            const cards = [...state.players[id].hand, ...state.community];
            if (cards.length < 5) return null;
            return evaluateBestHand(cards);
        }

        function getToCall(id) {
            return Math.max(0, state.currentBet - state.players[id].currentBet);
        }

        function getMinimumRaiseTo(id) {
            const player = state.players[id];
            if (player.stack <= 0) return player.currentBet;
            if (state.currentBet === 0) return Math.min(player.currentBet + player.stack, BIG_BLIND);
            return Math.min(player.currentBet + player.stack, state.currentBet + state.minRaise);
        }

        function getMaximumRaiseTo(id) {
            return state.players[id].currentBet + state.players[id].stack;
        }

        function updateRaiseUi() {
            if (!ui.raiseSlider || !ui.raiseReadout) return;
            const minTotal = getMinimumRaiseTo('human');
            const maxTotal = getMaximumRaiseTo('human');
            ui.raiseSlider.min = String(minTotal);
            ui.raiseSlider.max = String(Math.max(minTotal, maxTotal));
            ui.raiseSlider.step = String(state.currentBet >= BIG_BLIND * 4 ? 20 : 10);

            let nextValue = Number(ui.raiseSlider.value);
            if (Number.isNaN(nextValue) || nextValue < minTotal) nextValue = minTotal;
            if (nextValue > maxTotal) nextValue = maxTotal;
            ui.raiseSlider.value = String(nextValue);
            ui.raiseReadout.textContent = `Рейз до ${formatChips(nextValue)}`;
        }

        function startNewMatch() {
            state.players = createPlayers();
            state.stats.human = { hands: 0, raises: 0, calls: 0, folds: 0, vpip: 0 };
            state.stats.ai = { hands: 0, raises: 0, calls: 0, folds: 0, vpip: 0 };
            state.handNumber = 0;
            state.dealer = Math.random() > 0.5 ? 'human' : 'ai';
        }

        function startHand(resetMatch = false) {
            if (resetMatch || state.players.human.stack <= 0 || state.players.ai.stack <= 0) {
                startNewMatch();
                toast('Новая покерная сессия с Юи началась.', '#6b8c6c');
            } else {
                state.dealer = otherPlayer(state.dealer);
            }

            state.handNumber += 1;
            state.deck = shuffle(buildDeck());
            state.community = [];
            state.pot = 0;
            state.currentBet = 0;
            state.minRaise = BIG_BLIND;
            state.street = 'preflop';
            state.handOver = false;
            state.revealAiCards = false;
            state.aiThinking = false;

            for (const id of ['human', 'ai']) {
                state.players[id].hand = [];
                state.players[id].currentBet = 0;
                state.players[id].folded = false;
                state.players[id].allIn = false;
            }

            const dealOrder = [state.dealer, otherPlayer(state.dealer), state.dealer, otherPlayer(state.dealer)];
            dealOrder.forEach((id) => state.players[id].hand.push(drawCard()));

            postBlind(state.dealer, SMALL_BLIND);
            postBlind(otherPlayer(state.dealer), BIG_BLIND);

            state.pendingPlayers = new Set(playersWhoCanAct());
            state.acting = state.dealer;

            state.stats.human.hands += 1;
            state.stats.ai.hands += 1;

            setYuiLine('intro', 'Юи спокойно смотрит на тебя из-за карт.');
            logAction(`Раздача #${state.handNumber}. Блайнды ${SMALL_BLIND}/${BIG_BLIND}.`, 'system');
            render();
            queueAiTurn();
        }

        function isBettingRoundComplete() {
            const active = activePlayers();
            if (active.length <= 1) return true;
            const matched = active.every((id) => state.players[id].currentBet === state.currentBet || state.players[id].allIn);
            return matched && state.pendingPlayers.size === 0;
        }

        function revealRemainingBoard() {
            while (state.community.length < 5) state.community.push(drawCard());
        }

        function settlePot(winner, reason = 'showdown') {
            state.handOver = true;
            state.aiThinking = false;

            if (winner === 'split') {
                const half = Math.floor(state.pot / 2);
                state.players.human.stack += half;
                state.players.ai.stack += state.pot - half;
                logAction(`Банк делится поровну. Каждый получает по ${formatChips(half)}.`, 'system');
                setYuiLine('showdown', 'Похоже, мы прочитали эту раздачу одинаково точно.');
            } else {
                state.players[winner].stack += state.pot;
                logAction(`${state.players[winner].label} забирает банк ${formatChips(state.pot)}.`, winner === 'ai' ? 'ai' : 'player');
                setYuiLine(winner === 'ai' ? 'win' : 'lose', '');
            }

            if (reason === 'showdown') state.revealAiCards = true;

            state.pot = 0;
            state.acting = null;
            render();
        }

        function showdown() {
            revealRemainingBoard();
            state.revealAiCards = true;

            const humanBest = evaluateBestHand([...state.players.human.hand, ...state.community]);
            const aiBest = evaluateBestHand([...state.players.ai.hand, ...state.community]);
            const comparison = compareScoreArrays(humanBest.score, aiBest.score);

            logAction(`Вскрытие: у тебя ${humanBest.name.toLowerCase()}, у Юи ${aiBest.name.toLowerCase()}.`, 'system');
            setYuiLine('showdown', '');

            if (comparison > 0) settlePot('human');
            else if (comparison < 0) settlePot('ai');
            else settlePot('split');
        }

        function beginStreet(street) {
            state.street = street;
            clearPlayerRoundState();
            state.currentBet = 0;
            state.minRaise = BIG_BLIND;
            state.pendingPlayers = new Set(playersWhoCanAct());
            state.acting = street === 'preflop' ? state.dealer : otherPlayer(state.dealer);
            render();
            queueAiTurn();
        }

        function advanceStreet() {
            if (playersWhoCanAct().length <= 1) {
                revealRemainingBoard();
                showdown();
                return;
            }

            if (state.street === 'preflop') {
                state.community.push(drawCard(), drawCard(), drawCard());
                beginStreet('flop');
                return;
            }

            if (state.street === 'flop') {
                state.community.push(drawCard());
                beginStreet('turn');
                return;
            }

            if (state.street === 'turn') {
                state.community.push(drawCard());
                beginStreet('river');
                return;
            }

            showdown();
        }

        function afterAction(id) {
            if (activePlayers().length === 1) {
                settlePot(activePlayers()[0], 'fold');
                return;
            }

            if (playersWhoCanAct().length === 0) {
                revealRemainingBoard();
                showdown();
                return;
            }

            if (isBettingRoundComplete()) {
                advanceStreet();
                return;
            }

            state.acting = otherPlayer(id);
            render();
            queueAiTurn();
        }

        function commitChips(id, totalBetTarget) {
            const player = state.players[id];
            const additional = Math.max(0, totalBetTarget - player.currentBet);
            const actual = Math.min(additional, player.stack);
            player.stack -= actual;
            player.currentBet += actual;
            player.allIn = player.stack === 0;
            state.pot += actual;
            return player.currentBet;
        }

        function noteVoluntaryMoney(id) {
            state.stats[id].vpip += 1;
        }

        function applyAction(id, action, amount = null) {
            if (state.handOver || state.acting !== id) return;

            const player = state.players[id];
            const toCall = getToCall(id);

            if (action === 'fold') {
                state.players[id].folded = true;
                state.stats[id].folds += 1;
                logAction(`${player.label} выбрасывает карты.`, id === 'ai' ? 'ai' : 'player');
                setYuiLine(id === 'ai' ? 'fold' : 'pressure', '');
                settlePot(otherPlayer(id), 'fold');
                return;
            }

            if (action === 'check') {
                state.pendingPlayers.delete(id);
                logAction(`${player.label} чекает.`, id === 'ai' ? 'ai' : 'player');
                setYuiLine(id === 'ai' ? 'check' : 'think', '');
                afterAction(id);
                return;
            }

            if (action === 'call') {
                commitChips(id, state.currentBet);
                state.pendingPlayers.delete(id);

                if (toCall > 0) {
                    state.stats[id].calls += 1;
                    noteVoluntaryMoney(id);
                    logAction(`${player.label} коллирует ${formatChips(toCall)}.`, id === 'ai' ? 'ai' : 'player');
                    setYuiLine(id === 'ai' ? 'call' : 'think', '');
                } else {
                    logAction(`${player.label} чекает.`, id === 'ai' ? 'ai' : 'player');
                }

                afterAction(id);
                return;
            }

            if (action === 'raise') {
                const previousBet = state.currentBet;
                const minTotal = getMinimumRaiseTo(id);
                const maxTotal = getMaximumRaiseTo(id);
                const requested = Math.max(minTotal, Math.min(Number(amount) || minTotal, maxTotal));
                const finalTotal = commitChips(id, requested);
                const raiseSize = finalTotal - previousBet;

                state.currentBet = finalTotal;
                state.minRaise = Math.max(BIG_BLIND, raiseSize);
                state.pendingPlayers = new Set(playersWhoCanAct().filter((playerId) => playerId !== id));
                state.stats[id].raises += 1;
                noteVoluntaryMoney(id);

                logAction(`${player.label} ${previousBet === 0 ? 'ставит' : 'рейзит до'} ${formatChips(finalTotal)}.`, id === 'ai' ? 'ai' : 'player');
                setYuiLine(id === 'ai' ? 'pressure' : 'think', '');
                afterAction(id);
            }
        }

        function suggestAiBetSize(mode, strength) {
            const ai = state.players.ai;
            const minTotal = getMinimumRaiseTo('ai');
            const maxTotal = getMaximumRaiseTo('ai');
            const basePot = Math.max(state.pot, BIG_BLIND * 2);
            let total = minTotal;

            if (mode === 'jam' || ai.stack <= BIG_BLIND * 6) {
                return maxTotal;
            }

            if (state.currentBet === 0) {
                const factors = { value: 0.75, probe: 0.48, bluff: 0.42 };
                total = Math.round(basePot * (factors[mode] || 0.55));
            } else {
                const raiseFactor = { value: 0.9, probe: 0.62, bluff: 0.55 };
                total = Math.round(state.currentBet + Math.max(state.minRaise, (basePot + getToCall('ai')) * (raiseFactor[mode] || 0.7)));
            }

            if (strength > 0.94) total = Math.max(total, Math.round(ai.currentBet + ai.stack * 0.75));
            return Math.max(minTotal, Math.min(total, maxTotal));
        }

        function chooseAiAction() {
            const ai = state.players.ai;
            const hero = state.players.human;
            const toCall = getToCall('ai');
            const potAfterCall = state.pot + toCall;
            const preflop = state.street === 'preflop';
            const strength = preflop
                ? preflopStrength(ai.hand)
                : estimateWinProbability(ai.hand, state.community, [], window.innerWidth <= 680 ? 150 : 240);

            const humanAggression = state.stats.human.raises / Math.max(1, state.stats.human.hands);
            const bluffAllowance = preflop ? 0.08 : 0.12 + humanAggression * 0.08;
            const potOdds = toCall > 0 ? toCall / Math.max(1, potAfterCall) : 0;
            const boardPressure = state.community.length >= 3 ? 0.05 : 0;
            const adjustedStrength = Math.max(0.03, Math.min(0.99, strength - boardPressure + (ai.stack < hero.stack ? 0.02 : 0)));

            if (toCall === 0) {
                if (adjustedStrength > 0.81) return { type: 'raise', amount: suggestAiBetSize('value', adjustedStrength) };
                if (adjustedStrength > 0.62 && Math.random() > 0.28) return { type: 'raise', amount: suggestAiBetSize('probe', adjustedStrength) };
                if (Math.random() < bluffAllowance && state.community.length >= 3) return { type: 'raise', amount: suggestAiBetSize('bluff', adjustedStrength) };
                return { type: 'check' };
            }

            if (adjustedStrength > 0.9) return { type: 'raise', amount: suggestAiBetSize('jam', adjustedStrength) };
            if (adjustedStrength > potOdds + 0.18 && Math.random() > 0.34) return { type: 'raise', amount: suggestAiBetSize('value', adjustedStrength) };
            if (adjustedStrength > potOdds + 0.06) return { type: 'call' };
            if (toCall <= Math.max(BIG_BLIND * 2, ai.stack * 0.08) && Math.random() < bluffAllowance * 0.85) {
                return { type: 'raise', amount: suggestAiBetSize('bluff', adjustedStrength) };
            }
            return { type: 'fold' };
        }

        function queueAiTurn() {
            if (state.handOver || state.acting !== 'ai') return;
            state.aiThinking = true;
            render();
            setYuiLine('think', '');

            window.setTimeout(() => {
                if (state.handOver || state.acting !== 'ai') return;
                state.aiThinking = false;
                const decision = chooseAiAction();
                applyAction('ai', decision.type, decision.amount);
            }, 620 + Math.random() * 620);
        }

        function render() {
            const human = state.players.human;
            const ai = state.players.ai;

            ui.matchStatus.textContent = `Blinds ${SMALL_BLIND}/${BIG_BLIND} // Stacks ${formatChips(human.stack)} vs ${formatChips(ai.stack)}`;
            ui.roundLabel.textContent = state.handOver
                ? `Раздача #${Math.max(state.handNumber, 0)} завершена`
                : `Раздача #${state.handNumber} // ${STREET_LABELS[state.street]}`;
            ui.potValue.textContent = formatChips(state.pot);
            ui.streetBadge.textContent = STREET_LABELS[state.street] || 'Waiting';
            ui.aiStack.textContent = formatChips(ai.stack);
            ui.aiBet.textContent = formatChips(ai.currentBet);
            ui.playerStack.textContent = formatChips(human.stack);
            ui.playerBet.textContent = formatChips(human.currentBet);

            ui.aiDealer.classList.toggle('active', state.dealer === 'ai');
            ui.playerDealer.classList.toggle('active', state.dealer === 'human');
            ui.aiSeat.classList.toggle('is-active', !state.handOver && state.acting === 'ai');
            ui.playerSeat.classList.toggle('is-active', !state.handOver && state.acting === 'human');

            renderCards(ui.community, state.community, { placeholderCount: 5 });
            renderCards(ui.playerHand, human.hand, { placeholderCount: 2 });
            renderCards(ui.aiHand, ai.hand, { hidden: !state.revealAiCards, placeholderCount: 2 });

            const playerBest = getPlayerBestHand('human');
            ui.playerHandRank.textContent = playerBest ? playerBest.name : describeHoleCards(human.hand);

            const aiBest = getPlayerBestHand('ai');
            if (state.revealAiCards && aiBest) ui.aiHandRank.textContent = aiBest.name;
            else if (state.aiThinking) ui.aiHandRank.textContent = 'Yui is reading the table';
            else ui.aiHandRank.textContent = 'Poker face';

            updateRaiseUi();

            const toCall = getToCall('human');
            ui.callBtn.textContent = toCall > 0 ? `Колл ${formatChips(toCall)}` : 'Чек';

            const humanTurn = !state.handOver && state.acting === 'human' && !human.allIn;
            ui.foldBtn.disabled = !humanTurn;
            ui.callBtn.disabled = !humanTurn;
            ui.raiseBtn.disabled = !humanTurn || human.stack <= 0 || getMaximumRaiseTo('human') <= getMinimumRaiseTo('human');
            ui.raiseSlider.disabled = ui.raiseBtn.disabled;
            ui.newHandBtn.textContent = state.handOver ? 'Следующая раздача' : 'Сдать заново';
        }

        ui.foldBtn.addEventListener('click', () => {
            if (!state.handOver) applyAction('human', 'fold');
        });

        ui.callBtn.addEventListener('click', () => {
            if (state.handOver) return;
            const toCall = getToCall('human');
            applyAction('human', toCall > 0 ? 'call' : 'check');
        });

        ui.raiseBtn.addEventListener('click', () => {
            if (state.handOver) return;
            applyAction('human', 'raise', Number(ui.raiseSlider.value));
        });

        ui.raiseSlider.addEventListener('input', updateRaiseUi);

        ui.newHandBtn.addEventListener('click', () => {
            const resetMatch = state.players.human.stack <= 0 || state.players.ai.stack <= 0;
            startHand(resetMatch);
        });

        render();
        startHand(true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPokerWidget);
    } else {
        initPokerWidget();
    }
})();
