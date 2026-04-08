(function () {
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function ratio(top, bottom, fallback = 0) {
        if (!bottom) return fallback;
        return top / bottom;
    }

    function countBy(items, keyFn) {
        const map = new Map();
        items.forEach((item) => {
            const key = keyFn(item);
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }

    function getBoardTexture(board) {
        if (!Array.isArray(board) || board.length === 0) {
            return {
                wetness: 0.18,
                paired: false,
                monotone: false,
                twoTone: false,
                connectedness: 0.08,
                broadwayDensity: 0,
                maxSuitCount: 0
            };
        }

        const ranks = [...new Set(board.map((card) => card.value))].sort((a, b) => a - b);
        const suitCounts = [...countBy(board, (card) => card.suit).values()];
        const maxSuitCount = suitCounts.length ? Math.max(...suitCounts) : 0;
        const gaps = [];

        for (let i = 1; i < ranks.length; i++) {
            gaps.push(ranks[i] - ranks[i - 1]);
        }

        const closeGaps = gaps.filter((gap) => gap <= 2).length;
        const broadwayDensity = board.filter((card) => card.value >= 10).length / Math.max(1, board.length);
        const paired = ranks.length !== board.length;
        const monotone = maxSuitCount >= 3 && board.length === 3;
        const twoTone = maxSuitCount >= 2;
        const connectedness = clamp((closeGaps * 0.2) + (gaps.includes(1) ? 0.18 : 0) + (gaps.includes(2) ? 0.08 : 0), 0, 0.7);

        let wetness = 0.18;
        wetness += paired ? 0.08 : 0;
        wetness += monotone ? 0.28 : (twoTone ? 0.14 : 0);
        wetness += connectedness;
        wetness += broadwayDensity * 0.16;

        return {
            wetness: clamp(wetness, 0.08, 0.96),
            paired,
            monotone,
            twoTone,
            connectedness,
            broadwayDensity,
            maxSuitCount
        };
    }

    function getStraightDrawInfo(hand, board) {
        const values = [...new Set([...hand, ...board].map((card) => card.value))];
        if (values.includes(14)) values.push(1);
        values.sort((a, b) => a - b);

        let openEnded = false;
        let gutshot = false;
        let doubleGutshot = false;

        for (let start = 1; start <= 10; start++) {
            const windowValues = [start, start + 1, start + 2, start + 3, start + 4];
            const hits = windowValues.filter((value) => values.includes(value)).length;
            if (hits >= 5) {
                openEnded = true;
                continue;
            }
            if (hits === 4) {
                const missing = windowValues.find((value) => !values.includes(value));
                if (missing === start || missing === start + 4) {
                    openEnded = true;
                } else if (gutshot) {
                    doubleGutshot = true;
                } else {
                    gutshot = true;
                }
            }
        }

        return { openEnded, gutshot, doubleGutshot };
    }

    function getHandProfile(ctx) {
        const board = ctx.board || [];
        const hand = ctx.aiHand || [];
        const equity = clamp(ctx.equity || 0, 0.01, 0.99);
        const bestCategory = ctx.aiBestHand?.score?.[0] ?? 0;
        const boardHigh = board.length ? Math.max(...board.map((card) => card.value)) : 0;
        const holeValues = hand.map((card) => card.value);
        const boardValues = board.map((card) => card.value);
        const pairValuesOnBoard = boardValues.filter((value, index) => boardValues.indexOf(value) !== index);

        const overpair = hand.length === 2
            && hand[0].value === hand[1].value
            && board.length > 0
            && hand[0].value > boardHigh;

        const topPair = bestCategory === 1 && holeValues.some((value) => value === boardHigh);
        const topPairTopKicker = topPair && holeValues.includes(14);
        const secondPair = bestCategory === 1 && !topPair;
        const weakPair = bestCategory === 1 && !topPair && !overpair;

        const suitCounts = countBy([...hand, ...board], (card) => card.suit);
        const flushDraw = bestCategory < 5 && [...suitCounts.values()].some((count) => count === 4);
        const nutFlushDraw = flushDraw && hand.some((card) => card.value === 14 && suitCounts.get(card.suit) === 4);
        const straightDraw = getStraightDrawInfo(hand, board);
        const comboDraw = flushDraw && (straightDraw.openEnded || straightDraw.doubleGutshot);
        const pairOnBoard = pairValuesOnBoard.length > 0;
        const strongMade = bestCategory >= 3 || overpair || (bestCategory === 2) || (topPair && equity >= 0.68);
        const monster = bestCategory >= 4 || (bestCategory >= 3 && board.length >= 4);
        const showdownValue = strongMade || topPair || secondPair;
        const air = !showdownValue && !flushDraw && !straightDraw.openEnded && !straightDraw.gutshot && bestCategory === 0;

        return {
            equity,
            bestCategory,
            overpair,
            topPair,
            topPairTopKicker,
            secondPair,
            weakPair,
            flushDraw,
            nutFlushDraw,
            straightDraw,
            comboDraw,
            pairOnBoard,
            strongMade,
            monster,
            showdownValue,
            air
        };
    }

    function getPlayerProfile(stats, reads) {
        const humanStats = stats?.human || {};
        const humanReads = reads?.human || {};
        const recentActions = Array.isArray(reads?.recentActions) ? reads.recentActions.filter((entry) => entry?.actor === 'human') : [];
        const hands = Math.max(1, humanStats.hands || 0);
        const vpip = ratio(humanStats.vpip || 0, hands, 0.34);
        const raiseRate = ratio(humanStats.raises || 0, hands, 0.2);
        const callRate = ratio(humanStats.calls || 0, hands, 0.24);
        const foldRate = ratio(humanStats.folds || 0, hands, 0.22);
        const foldToPressure = ratio(humanReads.foldedToAggression || 0, humanReads.facedAggression || 0, 0.36);
        const postflopAggression = ratio(humanReads.postflopAggression || 0, hands, 0.18);
        const riverAggression = ratio(humanReads.riverAggression || 0, hands, 0.08);
        const bluffRevealRate = ratio(humanReads.bluffsShown || 0, humanReads.showdowns || 0, 0.12);
        const weakShowdownRate = ratio(humanReads.showdownWeak || 0, humanReads.showdowns || 0, 0.22);
        const recentPreflopCalls = recentActions.filter((entry) => entry.street === 'preflop' && entry.type === 'call');
        const limpCompletes = recentPreflopCalls.filter((entry) => entry.toCall > 0 && entry.toCall <= 20 && entry.currentBet <= 20).length;
        const defendCalls = recentPreflopCalls.filter((entry) => entry.toCall >= 20).length;
        const recentRiverCalls = recentActions.filter((entry) => entry.street === 'river' && entry.type === 'call').length;
        const recentRiverRaises = recentActions.filter((entry) => entry.street === 'river' && entry.type === 'raise').length;
        const recentChecks = recentActions.filter((entry) => entry.type === 'check').length;
        const sample = Math.max(1, recentActions.length);
        const limpRate = limpCompletes / Math.max(1, recentPreflopCalls.length);
        const riverStickiness = recentRiverCalls / Math.max(1, recentRiverCalls + recentRiverRaises + humanReads.foldedToAggression);
        const waitingRate = recentChecks / sample;

        return {
            vpip,
            raiseRate,
            callRate,
            foldRate,
            foldToPressure,
            postflopAggression,
            riverAggression,
            bluffRevealRate,
            weakShowdownRate,
            limpRate,
            defendCalls,
            riverStickiness,
            waitingRate,
            loose: vpip >= 0.58,
            tight: vpip <= 0.3,
            aggressive: raiseRate >= 0.34 || postflopAggression >= 0.3,
            passive: raiseRate <= 0.14 && callRate >= 0.24,
            sticky: foldToPressure <= 0.28 || callRate >= 0.36,
            folder: foldToPressure >= 0.54,
            bluffy: bluffRevealRate >= 0.24 || riverAggression >= 0.18,
            station: weakShowdownRate >= 0.38 && callRate >= 0.3,
            limpy: limpRate >= 0.55,
            cautiousRiver: riverStickiness <= 0.26 && riverAggression <= 0.1
        };
    }

    function getMatchPhase(ctx) {
        const completed = Number(ctx.summary?.completedHands) || 0;
        const aiStackBb = ratio(ctx.aiStack, ctx.bigBlind, 0);
        const humanStackBb = ratio(ctx.humanStack, ctx.bigBlind, 0);
        const lead = aiStackBb - humanStackBb;
        const effectiveBb = ratio(ctx.effectiveStack, ctx.bigBlind, 0);

        if (completed < 6) {
            return { name: 'opening', aggressionBoost: 0.04, cautionBoost: 0, valueBoost: 0.03 };
        }
        if (lead >= 22) {
            return { name: 'pressing-lead', aggressionBoost: 0.08, cautionBoost: -0.04, valueBoost: 0.05 };
        }
        if (lead <= -18) {
            return { name: 'recovery', aggressionBoost: 0.05, cautionBoost: 0.06, valueBoost: 0 };
        }
        if (effectiveBb <= 18) {
            return { name: 'short-stack', aggressionBoost: 0.07, cautionBoost: -0.02, valueBoost: 0.04 };
        }
        if (effectiveBb >= 55) {
            return { name: 'deep', aggressionBoost: 0.02, cautionBoost: 0.04, valueBoost: 0.03 };
        }
        return { name: 'midgame', aggressionBoost: 0.03, cautionBoost: 0.01, valueBoost: 0.02 };
    }

    function getLineProfile(ctx) {
        const actions = Array.isArray(ctx.handTrace) ? ctx.handTrace : [];
        const street = ctx.street;
        const streetActions = actions.filter((entry) => entry.street === street);
        const preflopActions = actions.filter((entry) => entry.street === 'preflop');
        const aggressive = actions.filter((entry) => entry.type === 'raise');
        const lastAggressor = aggressive.length ? aggressive[aggressive.length - 1].actor : null;
        const preflopAggressor = preflopActions.filter((entry) => entry.type === 'raise').slice(-1)[0]?.actor || null;
        const humanAggThisStreet = streetActions.filter((entry) => entry.actor === 'human' && entry.type === 'raise').length;
        const aiAggThisStreet = streetActions.filter((entry) => entry.actor === 'ai' && entry.type === 'raise').length;
        const humanChecksThisStreet = streetActions.filter((entry) => entry.actor === 'human' && entry.type === 'check').length;
        const actionsThisStreet = streetActions.length;

        return {
            lastAggressor,
            preflopAggressor,
            humanAggThisStreet,
            aiAggThisStreet,
            humanChecksThisStreet,
            actionsThisStreet,
            aiHasInitiative: lastAggressor === 'ai' || (street !== 'preflop' && preflopAggressor === 'ai' && humanAggThisStreet === 0)
        };
    }

    function hasBlocker(hand, targetValue) {
        return Array.isArray(hand) && hand.some((card) => card.value === targetValue);
    }

    function normalizeBet(total, ctx) {
        return clamp(Math.round(total / 10) * 10, ctx.minRaiseTo, ctx.maxRaiseTo);
    }

    function chooseRaiseSize(ctx, profile, texture, plan) {
        const potBase = Math.max(ctx.pot + ctx.toCall, ctx.bigBlind * 2);
        const wetBoost = texture.wetness * 0.18;
        const foldBoost = profile.folder ? 0.08 : 0;
        const stickyPenalty = profile.sticky ? 0.06 : 0;
        const sizeMap = {
            thinValue: 0.44,
            value: 0.62 + wetBoost,
            heavyValue: 0.86 + wetBoost,
            probe: 0.33,
            semibluff: 0.58 + foldBoost,
            bluff: 0.52 + foldBoost - stickyPenalty,
            squeeze: 1.02,
            jam: 9
        };

        if (plan === 'jam' || ctx.aiStack <= ctx.bigBlind * 7) {
            return ctx.maxRaiseTo;
        }

        if (ctx.toCall === 0) {
            return normalizeBet(potBase * (sizeMap[plan] || 0.56), ctx);
        }

        const total = ctx.currentBet + Math.max(ctx.minRaiseStep, (potBase * (sizeMap[plan] || 0.72)));
        return normalizeBet(total, ctx);
    }

    function buildPreflopPlan(ctx, profile) {
        const strength = ctx.preflopStrength;
        const pair = ctx.aiHand[0]?.value === ctx.aiHand[1]?.value;
        const suited = ctx.aiHand[0]?.suit === ctx.aiHand[1]?.suit;
        const highCard = Math.max(ctx.aiHand[0]?.value || 0, ctx.aiHand[1]?.value || 0);
        const connected = Math.abs((ctx.aiHand[0]?.value || 0) - (ctx.aiHand[1]?.value || 0)) <= 1;
        const blockerAce = hasBlocker(ctx.aiHand, 14);
        let archetype = 'control';
        let pressure = 0.35;
        let commit = 0.35;
        let bluff = 0.08;
        let note = 'Смотрит стартовый диапазон.';

        if (strength >= 0.9 || (pair && highCard >= 12)) {
            archetype = 'trap';
            pressure = 0.78;
            commit = 0.92;
            bluff = 0.02;
            note = 'Сильная стартовая рука. Готова играть крупный банк.';
        } else if (strength >= 0.74) {
            archetype = 'value-pressure';
            pressure = 0.66;
            commit = 0.7;
            bluff = 0.04;
            note = 'Работает на вэлью и инициативу.';
        } else if ((suited && connected) || (suited && highCard >= 11)) {
            archetype = 'semi-bluff';
            pressure = 0.52;
            commit = 0.46;
            bluff = 0.18;
            note = 'Рука с потенциалом на будущие улицы.';
        } else if (profile.folder && blockerAce) {
            archetype = 'bluff-pressure';
            pressure = 0.58;
            commit = 0.28;
            bluff = 0.34;
            note = 'Есть блокер и пространство для давления.';
        } else if (strength <= 0.34) {
            archetype = 'give-up';
            pressure = 0.08;
            commit = 0.12;
            bluff = 0.02;
            note = 'Слабая нижняя часть диапазона.';
        }

        return {
            version: 1,
            anchorStreet: 'preflop',
            streetPlan: 'preflop',
            archetype,
            pressure,
            commit,
            bluff,
            note,
            updatedOnStreet: 'preflop'
        };
    }

    function refinePlan(ctx, profile, texture, line, hand, phase) {
        const existing = ctx.handPlan && typeof ctx.handPlan === 'object'
            ? { ...ctx.handPlan }
            : buildPreflopPlan(ctx, profile);

        if (ctx.street === 'preflop') {
            return {
                ...existing,
                pressure: clamp(existing.pressure + phase.aggressionBoost, 0.04, 0.96),
                commit: clamp(existing.commit - phase.cautionBoost * 0.4, 0.06, 0.98),
                note: `${existing.note} Фаза: ${phase.name}.`
            };
        }

        const plan = { ...existing, updatedOnStreet: ctx.street };

        if (hand.monster) {
            plan.archetype = profile.aggressive && ctx.street !== 'river' ? 'trap' : 'value-pressure';
            plan.streetPlan = 'stack-pressure';
            plan.pressure = 0.9;
            plan.commit = 0.96;
            plan.bluff = 0.01;
            plan.note = 'Сильнейшая часть диапазона. Играет на крупный банк.';
            plan.pressure = clamp(plan.pressure + phase.valueBoost, 0.08, 0.98);
            return plan;
        }

        if (hand.strongMade) {
            plan.archetype = texture.wetness >= 0.48 ? 'value-protection' : 'value-pressure';
            plan.streetPlan = 'extract-value';
            plan.pressure = 0.68 + texture.wetness * 0.12;
            plan.commit = 0.72;
            plan.bluff = 0.04;
            plan.note = 'Есть вэлью. Нужно добирать и не давать дешёвых карт.';
            plan.pressure = clamp(plan.pressure + phase.valueBoost, 0.08, 0.98);
            return plan;
        }

        if (hand.comboDraw || hand.nutFlushDraw || hand.straightDraw.openEnded) {
            plan.archetype = 'semi-bluff';
            plan.streetPlan = 'pressure-with-equity';
            plan.pressure = 0.58 + texture.wetness * 0.08;
            plan.commit = 0.54;
            plan.bluff = 0.2;
            plan.note = 'Есть эквити и пространство для давления.';
            plan.pressure = clamp(plan.pressure + phase.aggressionBoost, 0.08, 0.98);
            return plan;
        }

        if (hand.showdownValue) {
            plan.archetype = 'control';
            plan.streetPlan = 'thin-showdown';
            plan.pressure = 0.34;
            plan.commit = 0.42;
            plan.bluff = 0.05;
            plan.note = 'Рука чаще идёт к вскрытию, чем в крупный банк.';
            plan.commit = clamp(plan.commit + phase.cautionBoost * 0.4, 0.08, 0.96);
            return plan;
        }

        if (line.aiHasInitiative && profile.folder && ctx.street !== 'river') {
            plan.archetype = 'bluff-pressure';
            plan.streetPlan = 'take-it-down';
            plan.pressure = 0.55;
            plan.commit = 0.22;
            plan.bluff = 0.36;
            plan.note = 'Диапазон соперника можно давить.';
            plan.bluff = clamp(plan.bluff + phase.aggressionBoost * 0.4, 0.02, 0.55);
            return plan;
        }

        plan.archetype = 'give-up';
        plan.streetPlan = 'shutdown';
        plan.pressure = 0.12;
        plan.commit = 0.14;
        plan.bluff = ctx.street === 'river' ? 0.02 : 0.1;
        plan.note = 'Плохой ран-аут. Лишний банк не нужен.';
        plan.commit = clamp(plan.commit + phase.cautionBoost * 0.4, 0.04, 0.9);
        return plan;
    }

    function decidePreflop(ctx, profile, plan) {
        const strength = ctx.preflopStrength;
        const pair = ctx.aiHand[0]?.value === ctx.aiHand[1]?.value;
        const suited = ctx.aiHand[0]?.suit === ctx.aiHand[1]?.suit;
        const highCard = Math.max(ctx.aiHand[0]?.value || 0, ctx.aiHand[1]?.value || 0);
        const lowCard = Math.min(ctx.aiHand[0]?.value || 0, ctx.aiHand[1]?.value || 0);
        const connected = Math.abs((ctx.aiHand[0]?.value || 0) - (ctx.aiHand[1]?.value || 0)) <= 1;
        const blockerAce = hasBlocker(ctx.aiHand, 14);
        const shortStack = ctx.aiStack <= ctx.bigBlind * 18;
        const isoSpot = ctx.toCall === 0;
        const price = ctx.toCall / Math.max(1, ctx.pot + ctx.toCall);
        const facingLarge = ctx.toCall >= ctx.bigBlind * 5;

        if (isoSpot) {
            if (plan.archetype === 'trap') {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, shortStack ? 'jam' : 'heavyValue'), plan };
            }
            if (plan.archetype === 'value-pressure') {
                const style = profile.limpy ? 'heavyValue' : 'value';
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, style), plan };
            }
            if (plan.archetype === 'semi-bluff') {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.12 }, 'probe'), plan };
            }
            if (plan.archetype === 'bluff-pressure' && Math.random() < plan.bluff) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.12 }, 'bluff'), plan };
            }
            return { type: 'check', plan };
        }

        if (shortStack && (strength >= 0.82 || (pair && highCard >= 9))) {
            return { type: 'raise', amount: ctx.maxRaiseTo, plan };
        }

        if (plan.archetype === 'trap') {
            if (profile.aggressive && Math.random() < 0.24) return { type: 'call', plan };
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, shortStack ? 'jam' : 'heavyValue'), plan };
        }

        if (plan.archetype === 'value-pressure') {
            if (facingLarge && strength < 0.8 && Math.random() < 0.26) return { type: 'call', plan };
            const style = profile.aggressive || profile.limpy ? 'squeeze' : 'value';
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.2 }, style), plan };
        }

        if (plan.archetype === 'semi-bluff') {
            if ((pair || suited || connected) && price <= 0.28) {
                if (profile.folder && Math.random() < 0.22) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, 'bluff'), plan };
                }
                return { type: 'call', plan };
            }
        }

        if (plan.archetype === 'bluff-pressure') {
            if (profile.folder && blockerAce && Math.random() < plan.bluff) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, 'bluff'), plan };
            }
            if ((profile.limpy || profile.passive) && ctx.toCall <= ctx.bigBlind * 2 && highCard >= 10) return { type: 'call', plan };
        }

        if (pair && highCard >= 5 && price <= 0.18) return { type: 'call', plan };
        if (suited && highCard >= 11 && price <= 0.16) return { type: 'call', plan };
        if (connected && highCard >= 8 && !facingLarge && price <= 0.12) return { type: 'call', plan };
        if (lowCard >= 10 && ctx.toCall <= ctx.bigBlind * 2) return { type: 'call', plan };

        return { type: 'fold', plan };
    }

    function decidePostflop(ctx, profile, texture, line, plan) {
        const hand = getHandProfile(ctx);
        const potOdds = ctx.toCall > 0 ? ctx.toCall / Math.max(1, ctx.pot + ctx.toCall) : 0;
        const spr = ratio(ctx.effectiveStack, Math.max(1, ctx.pot), 3.5);
        const leverage = clamp((texture.wetness * 0.4) + (profile.folder ? 0.12 : 0) + (line.aiHasInitiative ? 0.1 : 0), 0, 0.72);
        const semiBluffReady = hand.comboDraw || (hand.flushDraw && hand.straightDraw.gutshot) || hand.straightDraw.openEnded || hand.nutFlushDraw;
        const bluffCatchWindow = profile.aggressive || profile.bluffy;

        if (ctx.toCall === 0) {
            if (hand.monster) {
                if (plan.archetype === 'trap' && profile.aggressive && texture.wetness < 0.34 && Math.random() < 0.24) return { type: 'check', plan };
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, texture.wetness > 0.55 ? 'heavyValue' : 'value'), plan };
            }

            if (hand.strongMade) {
                if (hand.topPairTopKicker || hand.overpair || texture.wetness >= 0.44 || plan.pressure >= 0.6) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'value'), plan };
                }
                if (profile.aggressive && Math.random() < 0.2) return { type: 'check', plan };
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'thinValue'), plan };
            }

            if (semiBluffReady && (plan.archetype === 'semi-bluff' || profile.folder || line.humanChecksThisStreet > 0 || line.aiHasInitiative)) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'semibluff'), plan };
            }

            if (hand.air) {
                const bluffWindow = leverage + (texture.wetness < 0.34 ? 0.14 : 0) + (profile.tight ? 0.08 : 0) + plan.bluff * 0.4;
                if (Math.random() < bluffWindow) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
                }
            }

            if (hand.showdownValue && (profile.passive || texture.wetness < 0.36)) {
                if (Math.random() < (0.3 + plan.pressure * 0.2)) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'probe'), plan };
                }
            }

            return { type: 'check', plan };
        }

        if (hand.monster) {
            if (plan.archetype === 'trap' && profile.aggressive && Math.random() < 0.28 && ctx.street !== 'river') return { type: 'call', plan };
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, spr <= 1.6 ? 'jam' : 'heavyValue'), plan };
        }

        if (hand.strongMade) {
            if (ctx.street === 'river' && bluffCatchWindow && hand.topPair && potOdds <= 0.34) return { type: 'call', plan };
            if (texture.wetness >= 0.5 || profile.sticky) {
                if (Math.random() < (0.28 + plan.pressure * 0.18)) return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'value'), plan };
            }
            if (hand.equity >= potOdds - 0.02) return { type: 'call', plan };
        }

        if (semiBluffReady) {
            if ((hand.equity >= potOdds - 0.05) || ctx.toCall <= ctx.bigBlind * 4) {
                if ((profile.folder || ctx.street !== 'river') && Math.random() < (0.26 + plan.pressure * 0.24)) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'semibluff'), plan };
                }
                return { type: 'call', plan };
            }
        }

        if (hand.showdownValue) {
            if (ctx.street === 'river' && bluffCatchWindow && potOdds <= 0.3) return { type: 'call', plan };
            if (ctx.street !== 'river' && hand.equity >= potOdds + 0.03) return { type: 'call', plan };
        }

        if (hand.air && profile.folder && line.humanAggThisStreet === 1 && ctx.street !== 'river' && Math.random() < (0.08 + plan.bluff * 0.18)) {
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
        }

        if (bluffCatchWindow && ctx.street === 'river' && potOdds <= 0.18 && profile.bluffy) {
            return { type: 'call', plan };
        }

        return { type: 'fold', plan };
    }

    function decideRiver(ctx, profile, texture, line, plan) {
        const hand = getHandProfile(ctx);
        const potOdds = ctx.toCall > 0 ? ctx.toCall / Math.max(1, ctx.pot + ctx.toCall) : 0;
        const pressureBias = plan.pressure * 0.18;
        const bluffBias = plan.bluff * 0.28;

        if (ctx.toCall === 0) {
            if (hand.monster) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, plan.archetype === 'trap' ? 'heavyValue' : 'value'), plan };
            }

            if (hand.strongMade) {
                if (profile.station || profile.sticky || profile.bluffy) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, hand.topPairTopKicker ? 'value' : 'thinValue'), plan };
                }
                if (plan.archetype === 'value-pressure' && Math.random() < 0.5 + pressureBias) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'thinValue'), plan };
                }
                return { type: 'check', plan };
            }

            if (hand.showdownValue) {
                if ((profile.cautiousRiver || profile.folder) && Math.random() < 0.14 + bluffBias) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
                }
                return { type: 'check', plan };
            }

            if ((plan.archetype === 'bluff-pressure' || plan.archetype === 'semi-bluff') && (profile.folder || profile.cautiousRiver)) {
                if (Math.random() < 0.24 + bluffBias) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
                }
            }

            return { type: 'check', plan };
        }

        if (hand.monster) {
            if (profile.aggressive && !profile.cautiousRiver && Math.random() < 0.18) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'heavyValue'), plan };
            }
            return { type: 'call', plan };
        }

        if (hand.strongMade) {
            if (hand.topPairTopKicker && profile.bluffy && potOdds <= 0.42) return { type: 'call', plan };
            if ((profile.bluffy || profile.aggressive) && potOdds <= 0.3 + pressureBias) return { type: 'call', plan };
            if (profile.station && hand.topPair && potOdds <= 0.24) return { type: 'call', plan };
            return { type: 'fold', plan };
        }

        if (hand.showdownValue) {
            if ((profile.bluffy || profile.aggressive) && potOdds <= 0.16 + pressureBias) {
                return { type: 'call', plan };
            }
            return { type: 'fold', plan };
        }

        if (plan.archetype === 'bluff-pressure' && profile.folder && ctx.toCall <= ctx.bigBlind * 5 && Math.random() < 0.1 + bluffBias) {
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
        }

        return { type: 'fold', plan };
    }

    function decide(ctx) {
        const profile = getPlayerProfile(ctx.stats, ctx.reads);
        const phase = getMatchPhase(ctx);
        const texture = getBoardTexture(ctx.board);
        const line = getLineProfile(ctx);
        const hand = getHandProfile(ctx);
        const plan = refinePlan(ctx, profile, texture, line, hand, phase);

        if (ctx.street === 'preflop') {
            return decidePreflop(ctx, profile, plan);
        }

        if (ctx.street === 'river') {
            return decideRiver(ctx, profile, texture, line, plan);
        }

        return decidePostflop(ctx, profile, texture, line, plan);
    }

    window.BBPokerAI = {
        decide
    };
})();
