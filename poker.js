(() => {
    const STARTING_STACK = 1500;
    const POKER_STORAGE_KEY = 'bb_poker_state_v1';
    const BLIND_PRESETS = {
        low: { key: 'low', label: 'Низкий', small: 10, big: 20 },
        medium: { key: 'medium', label: 'Средний', small: 25, big: 50 },
        high: { key: 'high', label: 'Высокий', small: 50, big: 100 }
    };
    const DEFAULT_BLIND_PRESET = 'low';
    const SUITS = [
        { key: 's', symbol: '♠', color: 'black' },
        { key: 'h', symbol: '♥', color: 'red' },
        { key: 'd', symbol: '♦', color: 'red' },
        { key: 'c', symbol: '♣', color: 'black' }
    ];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const STREET_LABELS = {
        preflop: 'Старт',
        flop: 'Три карты',
        turn: 'Четвёртая карта',
        river: 'Последняя карта',
        showdown: 'Вскрытие'
    };
    const YUI_LINES = {
        intro: [
            'Начинаем. Смотри за ставками, не за лицом.',
            'Раздача пошла. Ошибку я запомню быстрее, чем ты.',
            'Работаем с диапазонами. Дальше будет проще.'
        ],
        think: [
            'Секунду. Линия ещё не закрыта.',
            'Считаю диапазон продолжения.',
            'Мне нужно одно точное решение.'
        ],
        pressure: [
            'Повышаю. Проверим качество твоего колла.',
            'Добавлю давление. Слабые руки здесь не остаются.',
            'Идём выше. Если у тебя есть ответ, показывай.'
        ],
        call: [
            'Колл. Этого достаточно.',
            'Остаюсь в раздаче.',
            'Продолжаем. Следующая карта скажет больше.'
        ],
        check: [
            'Чек. Информации пока достаточно.',
            'Пауза. Здесь спешка невыгодна.',
            'Пропускаю. Пусть стол договорит.'
        ],
        fold: [
            'Пас. Этот банк твой.',
            'Отпускаю. Цена продолжения выше ожидания.',
            'Здесь хватит. Переходим дальше.'
        ],
        win: [
            'Банк мой.',
            'Этого было достаточно.',
            'Линия закрыта в мою пользу.'
        ],
        lose: [
            'Хорошо. Этот банк заслужен.',
            'Точная линия. Засчитываю.',
            'Неплохо. Я это запомню.'
        ],
        showdown: [
            'Вскрытие. Теперь только карты.',
            'Смотрим факты.',
            'Дальше решает стол.'
        ]
    };

    let blindPresetKey = DEFAULT_BLIND_PRESET;
    let pendingBlindPresetKey = null;

    function getBlindPreset() {
        return BLIND_PRESETS[blindPresetKey] || BLIND_PRESETS[DEFAULT_BLIND_PRESET];
    }

    function getSmallBlind() {
        return getBlindPreset().small;
    }

    function getBigBlind() {
        return getBlindPreset().big;
    }

    function initPokerWidget() {
        const root = document.getElementById('poker-widget');
        if (!root) return;

        const ui = {
            launchBtn: document.getElementById('poker-launch-btn'),
            overlay: document.getElementById('poker-overlay'),
            modalShell: document.getElementById('poker-modal-shell'),
            closeBtn: document.getElementById('poker-close'),
            sessionFinish: document.getElementById('poker-session-finish'),
            sessionFinishKicker: document.getElementById('poker-session-finish-kicker'),
            sessionFinishTitle: document.getElementById('poker-session-finish-title'),
            sessionFinishCopy: document.getElementById('poker-session-finish-copy'),
            sessionFinishBtn: document.getElementById('poker-session-finish-btn'),
            newHandBtn: document.getElementById('poker-new-hand'),
            matchStatus: document.getElementById('poker-match-status'),
            roundLabel: document.getElementById('poker-round-label'),
            blindButtons: Array.from(document.querySelectorAll('[data-blind-preset]')),
            yuiLine: document.getElementById('poker-yui-line'),
            yuiAvatar: document.getElementById('poker-yui-avatar'),
            potValue: document.getElementById('poker-pot-value'),
            streetBadge: document.getElementById('poker-street-badge'),
            statHumanWins: document.getElementById('poker-stat-human-wins'),
            statAiWins: document.getElementById('poker-stat-ai-wins'),
            statTotal: document.getElementById('poker-stat-total'),
            statWinrate: document.getElementById('poker-stat-winrate'),
            statMaxPot: document.getElementById('poker-stat-max-pot'),
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
            quickRaiseBtns: Array.from(document.querySelectorAll('[data-raise-shortcut]')),
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
            minRaise: getBigBlind(),
            handNumber: 0,
            dealer: 'human',
            acting: null,
            street: 'preflop',
            pendingPlayers: new Set(),
            handOver: true,
            sessionOver: false,
            revealAiCards: false,
            aiThinking: false,
            logEntries: [],
            players: createPlayers(),
            stats: createStatsState(),
            reads: createReadsState(),
            handTrace: [],
            handPlan: null,
            summary: {
                completedHands: 0,
                humanWins: 0,
                aiWins: 0,
                maxPot: 0
            }
        };
        let lastTurnToastKey = '';
        let restoredSession = false;
        let sessionRestartTimer = null;

        function normalizePlayerLabels() {
            state.players.human.label = 'Ты';
            state.players.ai.label = 'Юи';
        }

        normalizePlayerLabels();

        function applyStaticText() {
            const pokerSection = document.getElementById('poker-section');
            if (pokerSection) {
                pokerSection.style.display = 'none';
            }

            if (ui.launchBtn) ui.launchBtn.textContent = 'Покер с Юи';
            if (ui.newHandBtn) ui.newHandBtn.textContent = 'Новая раздача';
            if (ui.foldBtn) ui.foldBtn.textContent = 'Сбросить';
            if (ui.callBtn) ui.callBtn.textContent = 'Уравнять';
            if (ui.raiseBtn) ui.raiseBtn.textContent = 'Повысить';

            const title = document.querySelector('#poker-section h2');
            if (title) title.textContent = 'Покер с Юи';

            const opponentName = document.querySelector('.poker-opponent-name');
            const opponentRole = document.querySelector('.poker-opponent-role');
            const aiSeatName = document.querySelector('#poker-ai-seat .poker-seat-name');
            const playerSeatName = document.querySelector('#poker-player-seat .poker-seat-name');
            const aiDealerChip = document.getElementById('poker-ai-dealer');
            const playerDealerChip = document.getElementById('poker-player-dealer');
            const aiStackLabel = document.querySelector('#poker-ai-seat .poker-seat-stack');
            const aiBetLabel = document.querySelector('#poker-ai-seat .poker-seat-bet');
            const playerStackLabel = document.querySelector('#poker-player-seat .poker-seat-stack');
            const playerBetLabel = document.querySelector('#poker-player-seat .poker-seat-bet');
            const potLabel = document.querySelector('.poker-pot-label');
            const raiseLabel = document.querySelector('.poker-raise-label');
            const logTitle = document.querySelector('.poker-log-title');

            const relabel = (container, prefix, valueNode) => {
                if (!container || !valueNode) return;
                container.textContent = `${prefix} `;
                container.appendChild(valueNode);
            };

            if (opponentName) opponentName.textContent = 'Хошикава Юи';
            if (opponentRole) opponentRole.textContent = 'Скрытый туз // азартный режим';
            if (aiSeatName) aiSeatName.textContent = 'Юи';
            if (playerSeatName) playerSeatName.textContent = 'Ты';
            if (aiDealerChip) aiDealerChip.textContent = 'Б';
            if (playerDealerChip) playerDealerChip.textContent = 'Б';
            relabel(aiStackLabel, 'Стек:', ui.aiStack);
            relabel(aiBetLabel, 'Ставка:', ui.aiBet);
            relabel(playerStackLabel, 'Стек:', ui.playerStack);
            relabel(playerBetLabel, 'Ставка:', ui.playerBet);
            if (potLabel) potLabel.textContent = 'Банк';
            if (raiseLabel) raiseLabel.textContent = 'Размер повышения';
            if (logTitle) logTitle.textContent = 'Лог раздачи';
            if (ui.yuiLine) {
                ui.yuiLine.textContent = 'Юи крутит карту между пальцами и уже выглядит так, будто читает твой темп.';
            }
        }

        function mountModal() {
            if (ui.modalShell && root.parentElement !== ui.modalShell) {
                ui.modalShell.appendChild(root);
            }
        }

        function openOverlay() {
            mountModal();
            if (ui.overlay) {
                if (ui.overlay._closeTimer) {
                    clearTimeout(ui.overlay._closeTimer);
                    ui.overlay._closeTimer = null;
                }
                ui.overlay.classList.remove('closing');
                ui.overlay.classList.add('active');
            }
            document.body.classList.add('poker-open');
            if (!state.handNumber) {
                startHand();
                return;
            }

            render();

            if (!state.handOver && state.acting === 'ai' && !state.aiThinking) {
                queueAiTurn();
            }

            if (restoredSession) {
                toast(`Партия восстановлена. Текущая раздача: #${state.handNumber}.`, '#dcb97a');
                restoredSession = false;
            }
        }

        function closeOverlay() {
            if (ui.overlay) {
                if (ui.overlay._closeTimer) {
                    clearTimeout(ui.overlay._closeTimer);
                    ui.overlay._closeTimer = null;
                }
                ui.overlay.classList.add('closing');
                ui.overlay.classList.remove('active');
                ui.overlay._closeTimer = setTimeout(() => {
                    ui.overlay.classList.remove('closing');
                    ui.overlay._closeTimer = null;
                }, 220);
            }
            document.body.classList.remove('poker-open');
            saveState();
        }

        applyStaticText();

        function syncBlindButtons() {
            ui.blindButtons.forEach((button) => {
                const isActive = button.dataset.blindPreset === blindPresetKey;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        function getQueuedBlindPreset() {
            return BLIND_PRESETS[pendingBlindPresetKey] || null;
        }

        function hasProgress() {
            return state.handNumber > 0 || state.summary.completedHands > 0 || state.sessionOver;
        }

        function hasBustedPlayer() {
            return state.players.human.stack <= 0 || state.players.ai.stack <= 0;
        }

        function applyBlindPreset(key, options = {}) {
            const { toastMessage = false } = options;
            if (!BLIND_PRESETS[key]) key = DEFAULT_BLIND_PRESET;

            if (!hasProgress()) {
                blindPresetKey = key;
                pendingBlindPresetKey = null;
                syncBlindButtons();
                state.minRaise = Math.max(state.minRaise, getBigBlind());
                render();
                saveState();
                if (toastMessage) {
                    const preset = getBlindPreset();
                    toast(`Темп игры: ${preset.label} (${preset.small}/${preset.big}).`, '#dcb97a');
                }
                return;
            }

            if (key === blindPresetKey) {
                if (pendingBlindPresetKey) {
                    pendingBlindPresetKey = null;
                    render();
                    saveState();
                    if (toastMessage) {
                        toast('Отложенная смена темпа отменена. Текущий уровень останется прежним.', '#9ec3ff');
                    }
                }
                return;
            }

            pendingBlindPresetKey = key;
            render();
            saveState();

            if (toastMessage) {
                const preset = BLIND_PRESETS[key];
                toast(`Темп ${preset.label} (${preset.small}/${preset.big}) включится со следующей сессии.`, '#dcb97a');
            }
        }

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

        function createStatsBlock() {
            return { hands: 0, raises: 0, calls: 0, folds: 0, vpip: 0 };
        }

        function createStatsState() {
            return {
                human: createStatsBlock(),
                ai: createStatsBlock()
            };
        }

        function createReadsState() {
            return {
                human: {
                    facedAggression: 0,
                    foldedToAggression: 0,
                    postflopAggression: 0,
                    riverAggression: 0,
                    showdowns: 0,
                    showdownWeak: 0,
                    showdownStrong: 0,
                    bluffsShown: 0
                },
                recentActions: []
            };
        }

        function randomItem(items) {
            return items[Math.floor(Math.random() * items.length)];
        }

        function setYuiLine(bucket, fallback) {
            if (!ui.yuiLine) return;
            const text = YUI_LINES[bucket]?.length ? randomItem(YUI_LINES[bucket]) : fallback;
            ui.yuiLine.textContent = text || '';
            saveState();
        }

        function toast(message, color) {
            if (typeof window.showLoFiToast === 'function') {
                window.showLoFiToast(message, color);
            }
        }

        function cloneCards(cards = []) {
            return cards.map((card) => ({ ...card }));
        }

        function clonePlayer(player) {
            return {
                label: player.label,
                stack: player.stack,
                hand: cloneCards(player.hand),
                currentBet: player.currentBet,
                folded: player.folded,
                allIn: player.allIn
            };
        }

        function renderLog() {
            if (!ui.log) return;
            ui.log.innerHTML = '';
            state.logEntries.forEach((entry) => {
                const row = document.createElement('div');
                row.className = `poker-log-entry ${entry.tone}`;
                row.textContent = entry.text;
                ui.log.appendChild(row);
            });
        }

        function saveState() {
            try {
                const snapshot = {
                    deck: cloneCards(state.deck),
                    community: cloneCards(state.community),
                    pot: state.pot,
                    currentBet: state.currentBet,
                    minRaise: state.minRaise,
                    handNumber: state.handNumber,
                    dealer: state.dealer,
                    acting: state.acting,
                    street: state.street,
                    pendingPlayers: [...state.pendingPlayers],
                    handOver: state.handOver,
                    sessionOver: state.sessionOver,
                    revealAiCards: state.revealAiCards,
                    players: {
                        human: clonePlayer(state.players.human),
                        ai: clonePlayer(state.players.ai)
                    },
                    stats: JSON.parse(JSON.stringify(state.stats)),
                    reads: JSON.parse(JSON.stringify(state.reads)),
                    handTrace: JSON.parse(JSON.stringify(state.handTrace)),
                    handPlan: state.handPlan ? JSON.parse(JSON.stringify(state.handPlan)) : null,
                    summary: JSON.parse(JSON.stringify(state.summary)),
                    logEntries: state.logEntries.slice(0, 18),
                    blindPresetKey,
                    pendingBlindPresetKey,
                    yuiLine: ui.yuiLine?.textContent || ''
                };
                window.localStorage.setItem(POKER_STORAGE_KEY, JSON.stringify(snapshot));
            } catch {}
        }

        function renderSessionFinish() {
            if (!ui.sessionFinish) return;

            ui.sessionFinish.classList.toggle('active', state.sessionOver);
            if (!state.sessionOver) return;

            const humanWon = state.players.human.stack > state.players.ai.stack;
            if (ui.sessionFinishKicker) {
                ui.sessionFinishKicker.textContent = humanWon ? 'Победа' : 'Поражение';
            }
            if (ui.sessionFinishTitle) {
                ui.sessionFinishTitle.textContent = humanWon ? 'Ты забрал все фишки' : 'Юи забрала все фишки';
            }
            if (ui.sessionFinishCopy) {
                const winnerStack = humanWon ? state.players.human.stack : state.players.ai.stack;
                ui.sessionFinishCopy.textContent = `${humanWon ? 'Сессия за тобой.' : 'Эта сессия за Юи.'} Победитель закончил со стеком ${formatChips(winnerStack)}. Статистика и ридсы сохранятся, а новая сессия начнётся только после подтверждения.`;
            }
        }

        function restoreState() {
            try {
                const raw = window.localStorage.getItem(POKER_STORAGE_KEY);
                if (!raw) return false;
                const snapshot = JSON.parse(raw);
                if (!snapshot || typeof snapshot !== 'object') return false;

                state.deck = cloneCards(snapshot.deck || []);
                state.community = cloneCards(snapshot.community || []);
                state.pot = Number(snapshot.pot) || 0;
                state.currentBet = Number(snapshot.currentBet) || 0;
                blindPresetKey = BLIND_PRESETS[snapshot.blindPresetKey] ? snapshot.blindPresetKey : DEFAULT_BLIND_PRESET;
                state.minRaise = Number(snapshot.minRaise) || getBigBlind();
                state.handNumber = Number(snapshot.handNumber) || 0;
                state.dealer = snapshot.dealer === 'ai' ? 'ai' : 'human';
                state.acting = snapshot.acting === 'ai' || snapshot.acting === 'human' ? snapshot.acting : null;
                state.street = snapshot.street || 'preflop';
                state.pendingPlayers = new Set(Array.isArray(snapshot.pendingPlayers) ? snapshot.pendingPlayers : []);
                state.handOver = Boolean(snapshot.handOver);
                state.sessionOver = Boolean(snapshot.sessionOver);
                state.revealAiCards = Boolean(snapshot.revealAiCards);
                state.aiThinking = false;
                pendingBlindPresetKey = BLIND_PRESETS[snapshot.pendingBlindPresetKey] ? snapshot.pendingBlindPresetKey : null;
                state.players = {
                    human: {
                        ...createPlayerState('Ты'),
                        ...(snapshot.players?.human || {}),
                        hand: cloneCards(snapshot.players?.human?.hand || [])
                    },
                    ai: {
                        ...createPlayerState('Юи'),
                        ...(snapshot.players?.ai || {}),
                        hand: cloneCards(snapshot.players?.ai?.hand || [])
                    }
                };
                state.stats = {
                    human: { ...createStatsBlock(), ...(snapshot.stats?.human || {}) },
                    ai: { ...createStatsBlock(), ...(snapshot.stats?.ai || {}) }
                };
                state.reads = {
                    ...createReadsState(),
                    ...(snapshot.reads || {}),
                    human: { ...createReadsState().human, ...(snapshot.reads?.human || {}) },
                    recentActions: Array.isArray(snapshot.reads?.recentActions) ? snapshot.reads.recentActions.slice(0, 60) : []
                };
                state.handTrace = Array.isArray(snapshot.handTrace) ? snapshot.handTrace.slice(0, 48) : [];
                state.handPlan = snapshot.handPlan && typeof snapshot.handPlan === 'object' ? snapshot.handPlan : null;
                state.summary = snapshot.summary || {
                    completedHands: 0,
                    humanWins: 0,
                    aiWins: 0,
                    maxPot: 0
                };
                state.logEntries = Array.isArray(snapshot.logEntries) ? snapshot.logEntries.slice(0, 18) : [];
                normalizePlayerLabels();
                syncBlindButtons();

                if (hasBustedPlayer()) {
                    state.sessionOver = true;
                    state.handOver = true;
                    state.acting = null;
                    state.aiThinking = false;
                    if (snapshot.yuiLine && ui.yuiLine) {
                        ui.yuiLine.textContent = snapshot.yuiLine;
                    }
                    return state.handNumber > 0 || state.logEntries.length > 0;
                }

                if (hasBustedPlayer()) {
                    state.sessionOver = true;
                    state.handOver = true;
                    const appliedPreset = startNewMatch();
                    startHand();
                    if (appliedPreset) {
                        toast(`Сессия автоматически перезапущена. Темп переключён на ${appliedPreset.label} (${appliedPreset.small}/${appliedPreset.big}).`, '#6b8c6c');
                    }
                }

                if (snapshot.yuiLine && ui.yuiLine) {
                    ui.yuiLine.textContent = snapshot.yuiLine;
                }

                return state.handNumber > 0 || state.logEntries.length > 0;
            } catch {
                return false;
            }
        }

        function notifyHumanTurn(force = false) {
            if (state.handOver || state.acting !== 'human') return;
            if (!ui.overlay?.classList.contains('active')) return;
            const key = `${state.handNumber}:${state.street}:${state.currentBet}:${state.players.human.currentBet}`;
            if (!force && lastTurnToastKey === key) return;
            lastTurnToastKey = key;
            toast('Твой ход. Юи ждёт решение.', '#60a5fa');
        }

        function renderSummary() {
            const total = Number(state.summary.completedHands) || 0;
            const humanWins = Number(state.summary.humanWins) || 0;
            const aiWins = Number(state.summary.aiWins) || 0;
            const maxPot = Number(state.summary.maxPot) || 0;
            const winrate = total > 0 ? Math.round((humanWins / total) * 100) : 0;

            if (ui.statHumanWins) ui.statHumanWins.textContent = formatChips(humanWins);
            if (ui.statAiWins) ui.statAiWins.textContent = formatChips(aiWins);
            if (ui.statTotal) ui.statTotal.textContent = formatChips(total);
            if (ui.statWinrate) ui.statWinrate.textContent = `${winrate}%`;
            if (ui.statMaxPot) ui.statMaxPot.textContent = formatChips(maxPot);
        }

        function describeActor(id, humanText, aiText) {
            return id === 'human' ? `Ты ${humanText}` : `Юи ${aiText}`;
        }

        function logAction(text, tone = 'system') {
            state.logEntries.unshift({ text, tone });
            state.logEntries = state.logEntries.slice(0, 18);
            renderLog();
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
            if (!Array.isArray(hand) || hand.length < 2) return 'Ожидание раздачи';
            const [first, second] = hand.slice().sort((a, b) => b.value - a.value);
            const suited = first.suit === second.suit;
            const gap = Math.abs(first.value - second.value);

            if (first.value === second.value) return `Пара на руках ${rankDisplay(first.rank)}`;
            if (suited && gap === 1) return 'Две соседние одномастные карты';
            if (first.value >= 13 && second.value >= 11) return 'Сильная старшая рука';
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
            if (state.currentBet === 0) return Math.min(player.currentBet + player.stack, getBigBlind());
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
            const baseStep = getBigBlind() >= 100 ? 50 : getBigBlind() >= 50 ? 25 : 10;
            ui.raiseSlider.step = String(state.currentBet >= getBigBlind() * 4 ? baseStep * 2 : baseStep);

            let nextValue = Number(ui.raiseSlider.value);
            if (Number.isNaN(nextValue) || nextValue < minTotal) nextValue = minTotal;
            if (nextValue > maxTotal) nextValue = maxTotal;
            ui.raiseSlider.value = String(nextValue);
            ui.raiseReadout.textContent = `Повысить до ${formatChips(nextValue)}`;
        }

        function setRaiseShortcut(shortcut) {
            if (!ui.raiseSlider) return;

            const minTotal = getMinimumRaiseTo('human');
            const maxTotal = getMaximumRaiseTo('human');
            let target = minTotal;

            if (shortcut === 'allin') {
                target = maxTotal;
            } else {
                const multiplier = shortcut === '3x' ? 3 : 2;
                const base = state.currentBet > 0 ? state.currentBet : getBigBlind();
                target = Math.round(base * multiplier);
            }

            target = Math.max(minTotal, Math.min(target, maxTotal));
            ui.raiseSlider.value = String(target);
            updateRaiseUi();
        }

        function startNewMatch() {
            const queuedPreset = getQueuedBlindPreset();
            const summarySnapshot = { ...state.summary };
            const statsSnapshot = JSON.parse(JSON.stringify(state.stats));
            const readsSnapshot = JSON.parse(JSON.stringify(state.reads));
            if (sessionRestartTimer) {
                clearTimeout(sessionRestartTimer);
                sessionRestartTimer = null;
            }
            if (queuedPreset) {
                blindPresetKey = queuedPreset.key;
                pendingBlindPresetKey = null;
            }
            state.players = createPlayers();
            normalizePlayerLabels();
            state.stats = statsSnapshot || createStatsState();
            state.reads = readsSnapshot || createReadsState();
            state.handTrace = [];
            state.handPlan = null;
            state.summary = summarySnapshot || { completedHands: 0, humanWins: 0, aiWins: 0, maxPot: 0 };
            state.logEntries = [];
            state.handNumber = 0;
            state.dealer = Math.random() > 0.5 ? 'human' : 'ai';
            state.handOver = true;
            state.sessionOver = false;
            state.pendingPlayers = new Set();
            state.currentBet = 0;
            state.pot = 0;
            state.community = [];
            state.deck = [];
            state.revealAiCards = false;
            state.aiThinking = false;
            syncBlindButtons();
            lastTurnToastKey = '';
            return queuedPreset;
        }

        function startHand(options = {}) {
            const { preserveHandNumber = false, redeal = false } = options;
            if (state.sessionOver || hasBustedPlayer()) {
                render();
                return;
                /*
                        ? `Баланс пополнен до ${formatChips(STARTING_STACK)}. Новая серия начинается.`
                        : 'Началась новая покерная сессия с Юи.',
                    '#6b8c6c'
                */
            } else if (!redeal && state.handNumber > 0) {
                state.dealer = otherPlayer(state.dealer);
            }

            if (!preserveHandNumber) {
                state.handNumber += 1;
            }
            state.deck = shuffle(buildDeck());
            state.community = [];
            state.pot = 0;
            state.currentBet = 0;
            state.minRaise = getBigBlind();
            state.street = 'preflop';
            state.handOver = false;
            state.sessionOver = false;
            state.revealAiCards = false;
            state.aiThinking = false;
            state.handTrace = [];
            state.handPlan = null;

            for (const id of ['human', 'ai']) {
                state.players[id].hand = [];
                state.players[id].currentBet = 0;
                state.players[id].folded = false;
                state.players[id].allIn = false;
            }

            const dealOrder = [state.dealer, otherPlayer(state.dealer), state.dealer, otherPlayer(state.dealer)];
            dealOrder.forEach((id) => state.players[id].hand.push(drawCard()));

            postBlind(state.dealer, getSmallBlind());
            postBlind(otherPlayer(state.dealer), getBigBlind());

            state.pendingPlayers = new Set(playersWhoCanAct());
            state.acting = state.dealer;

            if (!redeal) {
                state.stats.human.hands += 1;
                state.stats.ai.hands += 1;
            }
            lastTurnToastKey = '';

            setYuiLine('intro', 'Юи смотрит на тебя поверх карт и будто уже что-то поняла.');
            if (redeal) {
                logAction(`Раздача #${state.handNumber} пересдана без учёта в статистике.`, 'system');
            } else {
                logAction(`Раздача #${state.handNumber}. Блайнды ${getSmallBlind()}/${getBigBlind()}.`, 'system');
            }
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
            state.summary.completedHands += 1;
            state.summary.maxPot = Math.max(state.summary.maxPot, state.pot);

            if (winner === 'split') {
                const half = Math.floor(state.pot / 2);
                state.players.human.stack += half;
                state.players.ai.stack += state.pot - half;
                logAction(`Банк делится поровну. Каждый получает по ${formatChips(half)}.`, 'system');
                setYuiLine('showdown', 'Похоже, эту раздачу мы прочитали одинаково точно.');
            } else {
                if (winner === 'human') state.summary.humanWins += 1;
                if (winner === 'ai') state.summary.aiWins += 1;
                state.players[winner].stack += state.pot;
                logAction(
                    winner === 'human'
                        ? `Ты забираешь банк ${formatChips(state.pot)}.`
                        : `Юи забирает банк ${formatChips(state.pot)}.`,
                    winner === 'ai' ? 'ai' : 'player'
                );
                setYuiLine(winner === 'ai' ? 'win' : 'lose', '');
            }

            if (reason === 'showdown') state.revealAiCards = true;

            state.pot = 0;
            state.currentBet = 0;
            state.pendingPlayers = new Set();
            state.acting = null;
            state.sessionOver = hasBustedPlayer();
            if (state.sessionOver) {
                const leader = state.players.human.stack > state.players.ai.stack ? 'human' : 'ai';
                logAction(
                    leader === 'human'
                        ? `Сессия завершена. Ты забрал все фишки: ${formatChips(state.players.human.stack)} против ${formatChips(state.players.ai.stack)}.`
                        : `Сессия завершена. Юи забрала все фишки: ${formatChips(state.players.ai.stack)} против ${formatChips(state.players.human.stack)}.`,
                    leader === 'human' ? 'player' : 'ai'
                );
                toast('Сессия завершена. Победитель определён, можешь начать новую сессию из всплывающего окна.', '#dcb97a');
                render();
                return;
            }
            if (state.sessionOver) {
                const leader = state.players.human.stack > state.players.ai.stack ? 'human' : 'ai';
                logAction(
                    leader === 'human'
                        ? `Сессия завершена. Ты забрал все фишки: ${formatChips(state.players.human.stack)} против ${formatChips(state.players.ai.stack)}.`
                        : `Сессия завершена. Юи забрала все фишки: ${formatChips(state.players.ai.stack)} против ${formatChips(state.players.human.stack)}.`,
                    leader === 'human' ? 'player' : 'ai'
                );
                toast('Сессия завершена. Через мгновение начнётся новая сессия, а статистика и ридсы сохранятся.', '#dcb97a');
                if (sessionRestartTimer) clearTimeout(sessionRestartTimer);
                sessionRestartTimer = window.setTimeout(() => {
                    sessionRestartTimer = null;
                    const appliedPreset = startNewMatch();
                    toast(
                        appliedPreset
                            ? `Новая сессия началась автоматически. Темп переключён на ${appliedPreset.label} (${appliedPreset.small}/${appliedPreset.big}).`
                            : `Новая сессия началась автоматически. Стеки снова по ${formatChips(STARTING_STACK)}.`,
                        '#6b8c6c'
                    );
                    startHand();
                }, 1100);
            }
            render();
        }

        function showdown() {
            revealRemainingBoard();
            state.revealAiCards = true;

            const humanBest = evaluateBestHand([...state.players.human.hand, ...state.community]);
            const aiBest = evaluateBestHand([...state.players.ai.hand, ...state.community]);
            const comparison = compareScoreArrays(humanBest.score, aiBest.score);
            updateShowdownReads(humanBest);

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
            state.minRaise = getBigBlind();
            state.pendingPlayers = new Set(playersWhoCanAct());
            state.acting = street === 'preflop' ? state.dealer : otherPlayer(state.dealer);
            logAction(`${STREET_LABELS[street]}. Первый ход: ${state.acting === 'human' ? 'Ты' : 'Юи'}.`, 'system');
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

        function recordActionEvent(id, type, details = {}) {
            const entry = {
                handNumber: state.handNumber,
                street: state.street,
                actor: id,
                type,
                amount: Number(details.amount) || 0,
                toCall: Number(details.toCall) || 0,
                pot: Number(details.pot) || 0,
                currentBet: Number(details.currentBet) || 0
            };

            state.handTrace.push(entry);
            state.handTrace = state.handTrace.slice(-48);
            state.reads.recentActions.push(entry);
            state.reads.recentActions = state.reads.recentActions.slice(-60);

            if (id !== 'human') return;

            if (entry.toCall > 0) {
                state.reads.human.facedAggression += 1;
            }

            if (type === 'fold' && entry.toCall > 0) {
                state.reads.human.foldedToAggression += 1;
            }

            if (type === 'raise' && state.street !== 'preflop') {
                state.reads.human.postflopAggression += 1;
            }

            if (type === 'raise' && state.street === 'river') {
                state.reads.human.riverAggression += 1;
            }
        }

        function updateShowdownReads(humanBest) {
            if (!humanBest) return;

            state.reads.human.showdowns += 1;

            const aggressiveHumanLine = state.handTrace.some((entry) => entry.actor === 'human' && entry.type === 'raise');
            const weakShowdown = humanBest.score[0] <= 1;
            const strongShowdown = humanBest.score[0] >= 2;

            if (weakShowdown) state.reads.human.showdownWeak += 1;
            if (strongShowdown) state.reads.human.showdownStrong += 1;
            if (aggressiveHumanLine && weakShowdown) state.reads.human.bluffsShown += 1;
        }

        function applyAction(id, action, amount = null) {
            if (state.handOver || state.acting !== id) return;

            const toCall = getToCall(id);

            if (action === 'fold') {
                state.players[id].folded = true;
                state.stats[id].folds += 1;
                recordActionEvent(id, 'fold', {
                    toCall,
                    pot: state.pot,
                    currentBet: state.currentBet
                });
                logAction(describeActor(id, 'сбрасываешь карты.', 'сбрасывает карты.'), id === 'ai' ? 'ai' : 'player');
                setYuiLine(id === 'ai' ? 'fold' : 'pressure', '');
                settlePot(otherPlayer(id), 'fold');
                return;
            }

            if (action === 'check') {
                state.pendingPlayers.delete(id);
                recordActionEvent(id, 'check', {
                    toCall,
                    pot: state.pot,
                    currentBet: state.currentBet
                });
                logAction(describeActor(id, 'пропускаешь ход.', 'пропускает ход.'), id === 'ai' ? 'ai' : 'player');
                setYuiLine(id === 'ai' ? 'check' : 'think', '');
                afterAction(id);
                return;
            }

            if (action === 'call') {
                commitChips(id, state.currentBet);
                state.pendingPlayers.delete(id);
                recordActionEvent(id, 'call', {
                    amount: toCall,
                    toCall,
                    pot: state.pot,
                    currentBet: state.currentBet
                });

                if (toCall > 0) {
                    state.stats[id].calls += 1;
                    noteVoluntaryMoney(id);
                    logAction(
                        describeActor(id, `уравниваешь ставку на ${formatChips(toCall)}.`, `уравнивает ставку на ${formatChips(toCall)}.`),
                        id === 'ai' ? 'ai' : 'player'
                    );
                    setYuiLine(id === 'ai' ? 'call' : 'think', '');
                } else {
                    logAction(describeActor(id, 'пропускаешь ход.', 'пропускает ход.'), id === 'ai' ? 'ai' : 'player');
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
                state.minRaise = Math.max(getBigBlind(), raiseSize);
                state.pendingPlayers = new Set(playersWhoCanAct().filter((playerId) => playerId !== id));
                state.stats[id].raises += 1;
                noteVoluntaryMoney(id);
                recordActionEvent(id, 'raise', {
                    amount: finalTotal,
                    toCall,
                    pot: state.pot,
                    currentBet: previousBet
                });

                logAction(
                    describeActor(
                        id,
                        `${previousBet === 0 ? 'ставишь' : 'повышаешь ставку до'} ${formatChips(finalTotal)}.`,
                        `${previousBet === 0 ? 'ставит' : 'повышает ставку до'} ${formatChips(finalTotal)}.`
                    ),
                    id === 'ai' ? 'ai' : 'player'
                );
                setYuiLine(id === 'ai' ? 'pressure' : 'think', '');
                afterAction(id);
            }
        }

        function suggestAiBetSize(mode, strength) {
            const ai = state.players.ai;
            const minTotal = getMinimumRaiseTo('ai');
            const maxTotal = getMaximumRaiseTo('ai');
            const basePot = Math.max(state.pot, getBigBlind() * 2);
            let total = minTotal;

            if (mode === 'jam' || ai.stack <= getBigBlind() * 6) {
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

        function chooseAiActionLegacy() {
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
            if (toCall <= Math.max(getBigBlind() * 2, ai.stack * 0.08) && Math.random() < bluffAllowance * 0.85) {
                return { type: 'raise', amount: suggestAiBetSize('bluff', adjustedStrength) };
            }
            return { type: 'fold' };
        }

        function buildAiDecisionContext() {
            const ai = state.players.ai;
            const human = state.players.human;
            const simulations = window.innerWidth <= 680 ? 150 : 260;
            const equity = state.street === 'preflop'
                ? preflopStrength(ai.hand)
                : estimateWinProbability(ai.hand, state.community, [], simulations);

            return {
                street: state.street,
                board: cloneCards(state.community),
                aiHand: cloneCards(ai.hand),
                aiBestHand: getPlayerBestHand('ai'),
                preflopStrength: preflopStrength(ai.hand),
                equity,
                pot: state.pot,
                toCall: getToCall('ai'),
                currentBet: state.currentBet,
                minRaiseStep: state.minRaise,
                minRaiseTo: getMinimumRaiseTo('ai'),
                maxRaiseTo: getMaximumRaiseTo('ai'),
                aiStack: ai.stack,
                humanStack: human.stack,
                aiCurrentBet: ai.currentBet,
                humanCurrentBet: human.currentBet,
                effectiveStack: Math.min(ai.stack, human.stack),
                dealer: state.dealer,
                handNumber: state.handNumber,
                handTrace: JSON.parse(JSON.stringify(state.handTrace)),
                handPlan: state.handPlan ? JSON.parse(JSON.stringify(state.handPlan)) : null,
                stats: JSON.parse(JSON.stringify(state.stats)),
                reads: JSON.parse(JSON.stringify(state.reads)),
                summary: JSON.parse(JSON.stringify(state.summary)),
                bigBlind: getBigBlind(),
                smallBlind: getSmallBlind()
            };
        }

        function chooseAiAction() {
            return chooseAiActionLegacy();
        }

        function resolveAiTurn() {
            if (state.handOver || state.acting !== 'ai') {
                state.aiThinking = false;
                render();
                return;
            }

            let decision = null;
            try {
                decision = chooseAiAction();
            } catch {}

            if (!decision || typeof decision.type !== 'string') {
                try {
                    decision = chooseAiActionLegacy();
                } catch {}
            }

            if (!decision || typeof decision.type !== 'string') {
                decision = { type: getToCall('ai') > 0 ? 'call' : 'check' };
            }

            state.aiThinking = false;

            try {
                applyAction('ai', decision.type, decision.amount);
            } catch {
                const fallbackAction = getToCall('ai') > 0 ? 'call' : 'check';
                applyAction('ai', fallbackAction);
            }
        }

        function queueAiTurn() {
            if (state.handOver || state.acting !== 'ai' || state.aiThinking) return;
            state.aiThinking = true;
            render();
            setYuiLine('think', '');
            resolveAiTurn();
        }

        function render() {
            const human = state.players.human;
            const ai = state.players.ai;

            ui.matchStatus.textContent = `Блайнды ${getSmallBlind()}/${getBigBlind()} // Стеки ${formatChips(human.stack)} против ${formatChips(ai.stack)}`;
            const queuedPreset = getQueuedBlindPreset();
            const queuedSuffix = queuedPreset ? ` // След. темп ${queuedPreset.small}/${queuedPreset.big}` : '';
            ui.matchStatus.textContent += queuedSuffix;
            renderSummary();
            ui.roundLabel.textContent = state.handOver
                ? `Раздача #${Math.max(state.handNumber, 0)} завершена`
                : `Раздача #${state.handNumber} // ${STREET_LABELS[state.street]}`;
            if (state.sessionOver) {
                ui.roundLabel.textContent = 'Сессия завершена // Нажми «Новая сессия», чтобы начать заново';
            }
            ui.potValue.textContent = formatChips(state.pot);
            ui.streetBadge.textContent = STREET_LABELS[state.street] || 'Ожидание';
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
            else if (state.aiThinking) ui.aiHandRank.textContent = 'Юи читает стол';
            else ui.aiHandRank.textContent = 'Ничего не выдаёт';

            updateRaiseUi();

            const toCall = getToCall('human');
            ui.callBtn.textContent = toCall > 0 ? `Уравнять ${formatChips(toCall)}` : 'Пропустить';

            const humanTurn = !state.handOver && state.acting === 'human' && !human.allIn;
            ui.foldBtn.disabled = !humanTurn;
            ui.callBtn.disabled = !humanTurn;
            ui.raiseBtn.disabled = !humanTurn || human.stack <= 0 || getMaximumRaiseTo('human') <= getMinimumRaiseTo('human');
            ui.raiseSlider.disabled = ui.raiseBtn.disabled;
            ui.quickRaiseBtns.forEach((button) => {
                button.disabled = ui.raiseBtn.disabled;
            });
            ui.newHandBtn.textContent = state.handOver ? 'Следующая раздача' : 'Сдать заново';
            if (state.sessionOver) ui.newHandBtn.textContent = 'Новая сессия';
            renderLog();
            renderSessionFinish();
            saveState();
            notifyHumanTurn();
        }

        if (ui.launchBtn) {
            ui.launchBtn.addEventListener('click', openOverlay);
        }

        if (ui.closeBtn) {
            ui.closeBtn.addEventListener('click', closeOverlay);
        }

        if (ui.overlay) {
            ui.overlay.addEventListener('click', (event) => {
                if (event.target === ui.overlay) {
                    closeOverlay();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && ui.overlay?.classList.contains('active')) {
                closeOverlay();
            }
        });

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

        ui.quickRaiseBtns.forEach((button) => {
            button.addEventListener('click', () => {
                if (button.disabled) return;
                setRaiseShortcut(button.dataset.raiseShortcut);
            });
        });

        ui.blindButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const nextPreset = button.dataset.blindPreset || DEFAULT_BLIND_PRESET;
                applyBlindPreset(nextPreset, {
                    toastMessage: true
                });
            });
        });

        ui.newHandBtn.addEventListener('click', () => {
            if (state.sessionOver || hasBustedPlayer()) {
                const appliedPreset = startNewMatch();
                toast(
                    appliedPreset
                        ? `Новая сессия началась. Темп переключён на ${appliedPreset.label} (${appliedPreset.small}/${appliedPreset.big}).`
                        : `Новая сессия началась. Стеки снова по ${formatChips(STARTING_STACK)}.`,
                    '#6b8c6c'
                );
                startHand();
                return;
            }

            if (pendingBlindPresetKey) {
                const appliedPreset = startNewMatch();
                toast(
                    appliedPreset
                        ? `Новая игра началась. Темп переключён на ${appliedPreset.label} (${appliedPreset.small}/${appliedPreset.big}).`
                        : `Новая игра началась. Стеки снова по ${formatChips(STARTING_STACK)}.`,
                    '#6b8c6c'
                );
                startHand();
                return;
            }

            if (!state.handOver) {
                startHand({ preserveHandNumber: true, redeal: true });
                return;
            }

            startHand();
        });

        if (ui.sessionFinishBtn) {
            ui.sessionFinishBtn.addEventListener('click', () => {
                const appliedPreset = startNewMatch();
                toast(
                    appliedPreset
                        ? `Новая сессия началась. Темп переключён на ${appliedPreset.label} (${appliedPreset.small}/${appliedPreset.big}).`
                        : `Новая сессия началась. Стеки снова по ${formatChips(STARTING_STACK)}.`,
                    '#6b8c6c'
                );
                startHand();
            });
        }

        restoredSession = restoreState();
        if (!restoredSession) syncBlindButtons();
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPokerWidget);
    } else {
        initPokerWidget();
    }
})();
