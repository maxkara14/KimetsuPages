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
        const strongShowdownRate = ratio(humanReads.showdownStrong || 0, humanReads.showdowns || 0, 0.3);
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
            strongShowdownRate,
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
            cautiousRiver: riverStickiness <= 0.26 && riverAggression <= 0.1,
            honest: strongShowdownRate >= 0.46 && bluffRevealRate <= 0.08
        };
    }

    function getStreetValue(group, street) {
        return Number(group?.[street]) || 0;
    }

    function countRecentPatterns(patterns, target, mode = 'exact') {
        return patterns.filter((item) => {
            if (mode === 'prefix') return String(item || '').startsWith(target);
            return item === target;
        }).length;
    }

    function getAdaptationProfile(reads) {
        const humanReads = reads?.human || {};
        const facedByStreet = humanReads.facedByStreet || {};
        const foldedByStreet = humanReads.foldedByStreet || {};
        const calledByStreet = humanReads.calledByStreet || {};
        const raisedByStreet = humanReads.raisedByStreet || {};
        const checkedToByStreet = humanReads.checkedToByStreet || {};
        const probesByStreet = humanReads.probesByStreet || {};
        const checksBackByStreet = humanReads.checksBackByStreet || {};
        const recentPatterns = Array.isArray(humanReads.recentPatterns) ? humanReads.recentPatterns.slice(-10) : [];
        const recentSample = Math.max(1, recentPatterns.length);
        const totalFacedPostflop = getStreetValue(facedByStreet, 'flop') + getStreetValue(facedByStreet, 'turn') + getStreetValue(facedByStreet, 'river');
        const totalCheckedTo = getStreetValue(checkedToByStreet, 'flop') + getStreetValue(checkedToByStreet, 'turn') + getStreetValue(checkedToByStreet, 'river');
        const aggressiveShowdownStrong = Number(humanReads.aggressiveShowdownStrong) || 0;
        const aggressiveShowdownWeak = Number(humanReads.aggressiveShowdownWeak) || 0;
        const aggressiveShowdowns = aggressiveShowdownStrong + aggressiveShowdownWeak;

        const foldFallback = ratio(humanReads.foldedToAggression || 0, humanReads.facedAggression || 0, 0.34);
        const foldFlop = ratio(getStreetValue(foldedByStreet, 'flop'), getStreetValue(facedByStreet, 'flop'), foldFallback);
        const foldTurn = ratio(getStreetValue(foldedByStreet, 'turn'), getStreetValue(facedByStreet, 'turn'), foldFlop);
        const foldRiver = ratio(getStreetValue(foldedByStreet, 'river'), getStreetValue(facedByStreet, 'river'), Math.max(0.14, foldTurn * 0.82));
        const callDownRate = ratio(
            getStreetValue(calledByStreet, 'turn') + getStreetValue(calledByStreet, 'river'),
            getStreetValue(facedByStreet, 'turn') + getStreetValue(facedByStreet, 'river'),
            0.24
        );
        const fightBackRate = ratio(
            getStreetValue(raisedByStreet, 'flop') + getStreetValue(raisedByStreet, 'turn') + getStreetValue(raisedByStreet, 'river'),
            totalFacedPostflop,
            0.08
        );
        const probeFlop = ratio(getStreetValue(probesByStreet, 'flop'), getStreetValue(checkedToByStreet, 'flop'), 0.34);
        const probeTurn = ratio(getStreetValue(probesByStreet, 'turn'), getStreetValue(checkedToByStreet, 'turn'), Math.max(0.22, probeFlop * 0.92));
        const probeRiver = ratio(getStreetValue(probesByStreet, 'river'), getStreetValue(checkedToByStreet, 'river'), Math.max(0.18, probeTurn * 0.82));
        const checkBackFlop = ratio(getStreetValue(checksBackByStreet, 'flop'), getStreetValue(checkedToByStreet, 'flop'), 0.42);
        const checkBackTurn = ratio(getStreetValue(checksBackByStreet, 'turn'), getStreetValue(checkedToByStreet, 'turn'), 0.46);
        const honestAggression = ratio(aggressiveShowdownStrong, aggressiveShowdowns, 0.56);
        const bluffAggression = ratio(aggressiveShowdownWeak, aggressiveShowdowns, 0.18);
        const recentProbeRate = countRecentPatterns(recentPatterns, 'probe:', 'prefix') / recentSample;
        const recentFoldRate = countRecentPatterns(recentPatterns, 'fold:', 'prefix') / recentSample;
        const recentFightRate = countRecentPatterns(recentPatterns, 'fight:', 'prefix') / recentSample;
        const recentStickRate = countRecentPatterns(recentPatterns, 'stick:', 'prefix') / recentSample;
        const recentBluffRate = countRecentPatterns(recentPatterns, 'bluff-shown') / recentSample;
        const recentValueRate = countRecentPatterns(recentPatterns, 'value-shown') / recentSample;
        const confidence = clamp((totalFacedPostflop + totalCheckedTo + aggressiveShowdowns + recentPatterns.length * 0.6) / 24, 0.1, 1);
        const biasScale = 0.24 + confidence * 0.76;

        const pressureBias = clamp((
            foldFlop * 0.04 +
            foldTurn * 0.12 +
            foldRiver * 0.08 +
            recentFoldRate * 0.14 -
            callDownRate * 0.08 -
            fightBackRate * 0.16 -
            recentFightRate * 0.12
        ) * biasScale, -0.2, 0.28);

        const valueBias = clamp((
            callDownRate * 0.16 +
            (1 - foldRiver) * 0.08 +
            recentStickRate * 0.1 -
            foldTurn * 0.04
        ) * biasScale, -0.08, 0.24);

        const bluffCatchBias = clamp((
            probeFlop * 0.05 +
            probeTurn * 0.12 +
            probeRiver * 0.06 +
            bluffAggression * 0.18 +
            recentBluffRate * 0.18 -
            honestAggression * 0.08 -
            recentValueRate * 0.08
        ) * biasScale, 0, 0.34);

        const trapBias = clamp((
            probeFlop * 0.08 +
            probeTurn * 0.14 +
            recentProbeRate * 0.12 -
            checkBackFlop * 0.08 -
            checkBackTurn * 0.04
        ) * biasScale, 0, 0.3);

        const respectBias = clamp((
            honestAggression * 0.16 +
            recentValueRate * 0.12 +
            fightBackRate * 0.06 -
            bluffAggression * 0.12
        ) * biasScale, 0, 0.28);

        const overfoldFlop = foldFlop >= 0.42 && confidence >= 0.18;
        const overfoldTurn = foldTurn >= 0.5 && confidence >= 0.18;
        const overfoldRiver = foldRiver >= 0.36 && confidence >= 0.16;
        const probeHappy = (probeFlop >= 0.58 || probeTurn >= 0.54 || recentProbeRate >= 0.24) && confidence >= 0.18;
        const fightBack = (fightBackRate >= 0.18 || recentFightRate >= 0.22) && confidence >= 0.16;
        const stickyLater = (callDownRate >= 0.42 || recentStickRate >= 0.2) && confidence >= 0.16;
        const honestAggressor = honestAggression >= 0.72 && recentValueRate >= recentBluffRate && confidence >= 0.16;
        const suspiciousAggressor = (bluffAggression >= 0.34 || recentBluffRate > recentValueRate + 0.08) && confidence >= 0.16;

        let primaryExploit = 'balanced';
        let note = 'Balanced adaptation window';

        if (overfoldTurn) {
            primaryExploit = 'turn-pressure';
            note = 'Human overfolds to turn pressure';
        } else if (probeHappy) {
            primaryExploit = 'induce-probes';
            note = 'Human stabs after checks';
        } else if (suspiciousAggressor) {
            primaryExploit = 'bluff-catch';
            note = 'Aggression contains enough bluffs';
        } else if (honestAggressor) {
            primaryExploit = 'respect-raises';
            note = 'Aggression skews value-heavy';
        } else if (stickyLater) {
            primaryExploit = 'thin-value';
            note = 'Human calls down wider than average';
        } else if (fightBack) {
            primaryExploit = 'reduce-bluffs';
            note = 'Human fights back versus pressure';
        }

        return {
            confidence,
            foldFlop,
            foldTurn,
            foldRiver,
            callDownRate,
            fightBackRate,
            probeFlop,
            probeTurn,
            probeRiver,
            checkBackFlop,
            checkBackTurn,
            honestAggression,
            bluffAggression,
            pressureBias,
            valueBias,
            bluffCatchBias,
            trapBias,
            respectBias,
            overfoldFlop,
            overfoldTurn,
            overfoldRiver,
            probeHappy,
            fightBack,
            stickyLater,
            honestAggressor,
            suspiciousAggressor,
            primaryExploit,
            note
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
        const firstStreetAction = streetActions[0] || null;
        const secondStreetAction = streetActions[1] || null;
        const humanProbeBet = firstStreetAction?.actor === 'ai'
            && firstStreetAction?.type === 'check'
            && secondStreetAction?.actor === 'human'
            && secondStreetAction?.type === 'raise';
        const humanCheckedBack = firstStreetAction?.actor === 'ai'
            && firstStreetAction?.type === 'check'
            && secondStreetAction?.actor === 'human'
            && (secondStreetAction?.type === 'check' || (secondStreetAction?.type === 'call' && Number(secondStreetAction?.toCall) === 0));

        return {
            lastAggressor,
            preflopAggressor,
            humanAggThisStreet,
            aiAggThisStreet,
            humanChecksThisStreet,
            actionsThisStreet,
            humanProbeBet,
            humanCheckedBack,
            aiHasInitiative: lastAggressor === 'ai' || (street !== 'preflop' && preflopAggressor === 'ai' && humanAggThisStreet === 0)
        };
    }

    function normalizeWeights(weights) {
        const safeWeights = Object.fromEntries(
            Object.entries(weights).map(([key, value]) => [key, Math.max(0.02, Number(value) || 0)])
        );
        const total = Object.values(safeWeights).reduce((sum, value) => sum + value, 0) || 1;
        return Object.fromEntries(
            Object.entries(safeWeights).map(([key, value]) => [key, value / total])
        );
    }

    function estimateHumanRange(ctx, profile, texture, line, adaptation) {
        const actions = Array.isArray(ctx.handTrace) ? ctx.handTrace : [];
        const humanActions = actions.filter((entry) => entry?.actor === 'human');
        const preflopHuman = humanActions.filter((entry) => entry.street === 'preflop');
        const streetHuman = humanActions.filter((entry) => entry.street === ctx.street);
        const preflopCalls = preflopHuman.filter((entry) => entry.type === 'call').length;
        const preflopRaises = preflopHuman.filter((entry) => entry.type === 'raise').length;
        const streetCalls = streetHuman.filter((entry) => entry.type === 'call').length;
        const streetRaises = streetHuman.filter((entry) => entry.type === 'raise').length;
        const streetChecks = streetHuman.filter((entry) => entry.type === 'check').length;

        let strong = ctx.street === 'preflop' ? 0.26 : 0.24;
        let medium = ctx.street === 'preflop' ? 0.34 : 0.31;
        let draw = ctx.street === 'preflop' ? 0.14 : 0.23;
        let air = ctx.street === 'preflop' ? 0.26 : 0.22;

        if (preflopCalls > 0) {
            strong -= 0.07;
            medium += 0.05;
            draw += 0.05;
            air += 0.01;
        }

        if (preflopRaises > 0) {
            strong += profile.bluffy ? 0.08 : 0.14;
            medium += 0.02;
            draw += 0.02;
            air += profile.bluffy ? 0.06 : -0.12;
        }

        if (line.preflopAggressor !== 'human' && ctx.street !== 'preflop') {
            strong -= 0.05;
            medium += 0.04;
            air += 0.03;
        }

        if (streetChecks > 0 && streetRaises === 0) {
            air += 0.06;
            medium += 0.05;
            strong -= 0.05;
        }

        if (streetCalls > 0) {
            medium += 0.06;
            if (ctx.street === 'river') {
                draw -= 0.18;
                medium += 0.04;
                air += profile.bluffy ? 0.06 : 0.02;
                strong -= 0.02;
            } else {
                draw += texture.wetness >= 0.42 ? 0.14 : 0.06;
                air -= 0.04;
            }
        }

        if (streetRaises > 0) {
            strong += profile.bluffy ? 0.06 : (profile.honest ? 0.18 : 0.14);
            medium -= 0.04;
            if (ctx.street === 'river') {
                draw -= 0.18;
                air += profile.bluffy ? 0.06 : -0.06;
            } else {
                draw += texture.wetness >= 0.46 ? 0.1 : 0.03;
                air += profile.bluffy ? 0.08 : 0.02;
            }
        }

        if (profile.station) {
            medium += 0.05;
            strong -= 0.02;
            air -= 0.03;
        }

        if (profile.folder) {
            air += 0.04;
            medium += 0.02;
            strong -= 0.03;
        }

        if (profile.sticky) {
            medium += 0.04;
            draw += ctx.street === 'river' ? -0.04 : 0.03;
            air -= 0.02;
        }

        if (profile.bluffy) {
            air += 0.06;
            strong -= 0.01;
        }

        if (profile.honest) {
            strong += 0.05;
            air -= 0.05;
        }

        if (adaptation?.overfoldTurn && ctx.street === 'turn') {
            medium += 0.03;
            air += 0.04;
            strong -= 0.03;
        }

        if (adaptation?.probeHappy && line.humanProbeBet) {
            air += adaptation.suspiciousAggressor ? 0.12 : 0.08;
            medium += 0.03;
            strong -= adaptation.honestAggressor ? 0.02 : 0.06;
        }

        if (adaptation?.stickyLater && streetCalls > 0 && ctx.street !== 'preflop') {
            medium += 0.05;
            strong += 0.02;
            air -= 0.04;
        }

        if (adaptation?.honestAggressor && streetRaises > 0) {
            strong += 0.08;
            air -= 0.05;
        }

        if (adaptation?.suspiciousAggressor && streetRaises > 0) {
            air += 0.08;
            strong -= 0.04;
        }

        if (ctx.street === 'river') {
            draw = Math.max(0.02, draw * 0.2);
        }

        const weights = normalizeWeights({ strong, medium, draw, air });
        const capped = clamp(
            (line.preflopAggressor === 'ai' ? 0.18 : 0) +
            (preflopRaises === 0 ? 0.16 : 0) +
            (streetCalls > 0 ? 0.18 : 0) +
            (streetChecks > 0 ? 0.12 : 0) -
            (streetRaises > 0 ? 0.22 : 0) -
            (weights.strong > 0.45 ? 0.12 : 0),
            0.02,
            0.95
        );

        const pressureWindow = clamp(
            profile.foldToPressure * 0.36 +
            capped * 0.34 +
            weights.air * 0.24 +
            weights.medium * 0.16 -
            weights.strong * 0.26 -
            (profile.sticky ? 0.08 : 0) -
            (adaptation?.respectBias || 0) * 0.4 +
            (adaptation?.pressureBias || 0) +
            (adaptation?.overfoldTurn && ctx.street === 'turn' ? 0.08 : 0) -
            (adaptation?.fightBack ? 0.06 : 0) -
            (ctx.street === 'river' ? 0.06 : 0),
            0.03,
            0.92
        );

        const bluffCatchWindow = clamp(
            weights.air * 0.34 +
            (profile.bluffy ? 0.18 : 0) +
            (adaptation?.bluffCatchBias || 0) +
            (line.humanProbeBet ? (adaptation?.trapBias || 0) * 0.4 : 0) +
            (ctx.street === 'river' ? 0.1 : 0) -
            (adaptation?.respectBias || 0) * 0.3 -
            weights.strong * 0.18,
            0.02,
            0.82
        );

        const valueWindow = clamp(
            weights.medium * 0.34 +
            weights.strong * 0.56 +
            (profile.station ? 0.1 : 0) +
            (adaptation?.valueBias || 0) +
            (adaptation?.stickyLater ? 0.04 : 0) +
            (profile.sticky ? 0.06 : 0),
            0.08,
            0.96
        );

        let label = 'Mixed range';
        let exploit = 'balanced';

        if (line.humanProbeBet && adaptation?.probeHappy) {
            label = 'Probe-heavy stab range';
            exploit = 'trap';
        } else if (ctx.street === 'turn' && adaptation?.overfoldTurn) {
            label = 'Elastic turn range';
            exploit = 'barrel';
        } else if (weights.strong >= 0.48) {
            label = 'Dense value range';
            exploit = 'respect';
        } else if (ctx.street !== 'river' && weights.draw >= 0.32) {
            label = 'Draw-heavy range';
            exploit = 'charge';
        } else if (capped >= 0.58) {
            label = 'Capped calling range';
            exploit = 'pressure';
        } else if (weights.air >= 0.3) {
            label = 'Shaky range';
            exploit = 'punish';
        } else if (weights.medium >= 0.42) {
            label = 'One-pair heavy range';
            exploit = 'thin-value';
        }

        return {
            strongWeight: weights.strong,
            mediumWeight: weights.medium,
            drawWeight: weights.draw,
            airWeight: weights.air,
            capped,
            pressureWindow,
            bluffCatchWindow,
            valueWindow,
            label,
            exploit
        };
    }

    function describeHandBucket(hand) {
        if (hand.monster) return 'Top-end value';
        if (hand.strongMade) return 'Strong made hand';
        if (hand.comboDraw || hand.nutFlushDraw || hand.straightDraw.openEnded || hand.straightDraw.doubleGutshot) {
            return 'Equity-driven pressure';
        }
        if (hand.showdownValue) return 'Showdown-weighted hand';
        return 'Fold-equity hand';
    }

    function buildSpeech(decision, ctx, plan, hand, range, adaptation) {
        if (!decision || !decision.type) return '';

        if (adaptation?.probeHappy && decision.type === 'check' && plan.archetype === 'trap') {
            return 'Продолжай. Мне нравится, когда ты входишь в банк первым.';
        }

        if (adaptation?.overfoldTurn && decision.type === 'raise' && ctx.street === 'turn') {
            return 'Терн тебе явно не нравится. Проверим это еще раз.';
        }

        if (adaptation?.valueBias >= 0.14 && decision.type === 'raise' && hand.strongMade) {
            return 'Ты слишком любишь досматривать до конца. Это дорогая привычка.';
        }

        if (adaptation?.bluffCatchBias >= 0.18 && decision.type === 'call' && ctx.street === 'river') {
            return 'Если это спектакль, то финал у него слабоват.';
        }

        if (adaptation?.respectBias >= 0.16 && decision.type === 'fold' && range.strongWeight >= 0.34) {
            return 'На этот раз ты звучишь убедительно. Забирай.';
        }

        switch (decision.type) {
            case 'raise':
                if (hand.monster) return 'Не останавливайся. Мне как раз нравится этот размер банка.';
                if (hand.strongMade) {
                    if (range.drawWeight >= 0.28 && ctx.street !== 'river') {
                        return 'Следующую карту ты увидишь только по хорошей цене.';
                    }
                    if (range.valueWindow >= 0.62) {
                        return 'Раз уж ты все равно остаешься, пусть это будет красиво.';
                    }
                    return 'Если хочешь идти дальше, делай это уже всерьез.';
                }
                if (hand.comboDraw || hand.nutFlushDraw || hand.straightDraw.openEnded || hand.straightDraw.gutshot) {
                    return range.capped >= 0.56
                        ? 'Ты оставил слишком много сомнений. Я надавлю.'
                        : 'Посмотрим, насколько тебе комфортно под давлением.';
                }
                if (plan.archetype === 'bluff-pressure' || range.pressureWindow >= 0.58) {
                    return ctx.street === 'river'
                        ? 'Последнее слово в этой раздаче пока не у тебя.'
                        : 'Ты держишься слишком спокойно. Я это немного испорчу.';
                }
                return 'Я просто ускорю игру. Смотри не споткнись.';

            case 'call':
                if (hand.monster && ctx.street !== 'river') return 'Нет, уходить тебе пока рано.';
                if (hand.strongMade) {
                    return range.bluffCatchWindow >= 0.22
                        ? 'Нет, я еще не закончила смотреть на тебя.'
                        : 'Этого недостаточно, чтобы меня сдвинуть.';
                }
                if (hand.comboDraw || hand.flushDraw || hand.straightDraw.openEnded || hand.straightDraw.gutshot) {
                    return 'Ладно. Еще одна карта. Не разочаруй меня.';
                }
                return 'Пока побуду рядом. Вдруг ты ошибешься первым.';

            case 'check':
                if (hand.monster && plan.archetype === 'trap') return 'Ход за тобой. Удиви меня.';
                if (hand.showdownValue) return 'Мне некуда спешить. Тебе, похоже, тоже.';
                if (range.strongWeight >= 0.42) return 'Тишина здесь звучит лучше любой ставки.';
                return 'Пауза. Иногда она давит сильнее ставки.';

            case 'fold':
                if (range.strongWeight >= 0.42 || ctx.street === 'river') {
                    return 'Оставлю тебе этот банк. Не привыкай.';
                }
                return 'Слишком скучно. Следующую раздачу сыграй лучше.';

            default:
                return '';
        }
    }

    function buildReasoning(ctx, plan, hand, range, decision, adaptation) {
        let confidence = 0.46;

        if (decision.type === 'raise') {
            confidence += hand.monster ? 0.34 : (hand.strongMade ? 0.24 : range.pressureWindow * 0.22);
        } else if (decision.type === 'call') {
            confidence += hand.showdownValue ? 0.18 : ((hand.comboDraw || hand.flushDraw || hand.straightDraw.openEnded) ? 0.14 : range.bluffCatchWindow * 0.16);
        } else if (decision.type === 'fold') {
            confidence += range.strongWeight * 0.24 + (1 - clamp(ctx.equity || 0, 0, 1)) * 0.18;
        } else {
            confidence += plan.commit * 0.08;
        }

        confidence += (adaptation?.confidence || 0) * 0.06;
        confidence = clamp(confidence - (ctx.street === 'river' ? 0 : 0.02 * (ctx.board?.length || 0)), 0.18, 0.98);

        return {
            version: 2,
            street: ctx.street,
            archetype: plan.archetype,
            handLabel: describeHandBucket(hand),
            rangeLabel: range.label,
            exploit: range.exploit,
            adaptation: adaptation?.primaryExploit || 'balanced',
            readLabel: adaptation?.note || 'Balanced adaptation window',
            confidence,
            summary: `${describeHandBucket(hand)}. ${range.label}. ${adaptation?.note || 'Balanced adaptation window'}.`,
            speech: buildSpeech(decision, ctx, plan, hand, range, adaptation)
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

    function applyAdaptationToPlan(plan, ctx, hand, line, adaptation) {
        if (!adaptation) return plan;

        const adapted = { ...plan };
        adapted.pressure = clamp(adapted.pressure + adaptation.pressureBias, 0.04, 0.98);
        adapted.commit = clamp(
            adapted.commit + adaptation.valueBias * 0.4 + adaptation.bluffCatchBias * 0.16 - adaptation.respectBias * 0.22,
            0.04,
            0.98
        );
        adapted.bluff = clamp(
            adapted.bluff + adaptation.pressureBias * 0.5 - adaptation.respectBias * 0.48 - adaptation.fightBackRate * 0.24,
            0.01,
            0.58
        );

        if (hand.monster && adaptation.probeHappy && ctx.toCall === 0 && ctx.street !== 'river' && !line.humanAggThisStreet) {
            adapted.archetype = 'trap';
            adapted.streetPlan = 'induce-stab';
            adapted.pressure = clamp(adapted.pressure - 0.14, 0.08, 0.96);
            adapted.commit = clamp(adapted.commit + 0.04, 0.04, 0.98);
            adapted.note = `${adapted.note} Adapt: induce probe.`;
        } else if ((hand.strongMade || hand.showdownValue) && adaptation.valueBias >= 0.14) {
            adapted.note = `${adapted.note} Adapt: thinner value.`;
        } else if (adaptation.respectBias >= 0.16 && ctx.toCall > 0) {
            adapted.note = `${adapted.note} Adapt: respect aggression.`;
        } else if (adaptation.pressureBias >= 0.14 && ctx.street !== 'river') {
            adapted.note = `${adapted.note} Adapt: increase pressure.`;
        }

        return adapted;
    }

    function refinePlan(ctx, profile, texture, line, hand, phase, range, adaptation) {
        const existing = ctx.handPlan && typeof ctx.handPlan === 'object'
            ? { ...ctx.handPlan }
            : buildPreflopPlan(ctx, profile);

        if (ctx.street === 'preflop') {
            return applyAdaptationToPlan({
                ...existing,
                pressure: clamp(existing.pressure + phase.aggressionBoost + range.pressureWindow * 0.08, 0.04, 0.96),
                commit: clamp(existing.commit - phase.cautionBoost * 0.4 - range.strongWeight * 0.04, 0.06, 0.98),
                bluff: clamp(existing.bluff + range.pressureWindow * 0.06 - range.strongWeight * 0.04, 0.01, 0.55),
                note: `${existing.note} Фаза: ${phase.name}.`
            }, ctx, hand, line, adaptation);
        }

        const plan = { ...existing, updatedOnStreet: ctx.street };

        if (hand.monster) {
            plan.archetype = profile.aggressive && ctx.street !== 'river' ? 'trap' : 'value-pressure';
            plan.streetPlan = 'stack-pressure';
            plan.pressure = 0.9;
            plan.commit = 0.96;
            plan.bluff = 0.01;
            plan.note = 'Сильнейшая часть диапазона. Играет на крупный банк.';
            plan.pressure = clamp(plan.pressure + phase.valueBoost + range.valueWindow * 0.06, 0.08, 0.98);
            return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
        }

        if (hand.strongMade) {
            plan.archetype = texture.wetness >= 0.48 ? 'value-protection' : 'value-pressure';
            plan.streetPlan = 'extract-value';
            plan.pressure = 0.68 + texture.wetness * 0.12;
            plan.commit = 0.72;
            plan.bluff = 0.04;
            plan.note = 'Есть вэлью. Нужно добирать и не давать дешёвых карт.';
            plan.pressure = clamp(plan.pressure + phase.valueBoost + range.valueWindow * 0.06, 0.08, 0.98);
            return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
        }

        if (hand.comboDraw || hand.nutFlushDraw || hand.straightDraw.openEnded) {
            plan.archetype = 'semi-bluff';
            plan.streetPlan = 'pressure-with-equity';
            plan.pressure = 0.58 + texture.wetness * 0.08;
            plan.commit = 0.54;
            plan.bluff = 0.2;
            plan.note = 'Есть эквити и пространство для давления.';
            plan.pressure = clamp(plan.pressure + phase.aggressionBoost + range.pressureWindow * 0.1, 0.08, 0.98);
            return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
        }

        if (hand.showdownValue) {
            plan.archetype = 'control';
            plan.streetPlan = 'thin-showdown';
            plan.pressure = 0.34;
            plan.commit = 0.42;
            plan.bluff = 0.05;
            plan.note = 'Рука чаще идёт к вскрытию, чем в крупный банк.';
            plan.commit = clamp(plan.commit + phase.cautionBoost * 0.4 + range.strongWeight * 0.08, 0.08, 0.96);
            return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
        }

        if (line.aiHasInitiative && (profile.folder || range.pressureWindow >= 0.56) && ctx.street !== 'river') {
            plan.archetype = 'bluff-pressure';
            plan.streetPlan = 'take-it-down';
            plan.pressure = 0.55;
            plan.commit = 0.22;
            plan.bluff = 0.36;
            plan.note = 'Диапазон соперника можно давить.';
            plan.bluff = clamp(plan.bluff + phase.aggressionBoost * 0.4 + range.pressureWindow * 0.08, 0.02, 0.55);
            return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
        }

        plan.archetype = 'give-up';
        plan.streetPlan = 'shutdown';
        plan.pressure = 0.12;
        plan.commit = 0.14;
        plan.bluff = ctx.street === 'river' ? 0.02 : 0.1;
        plan.note = 'Плохой ран-аут. Лишний банк не нужен.';
        plan.commit = clamp(plan.commit + phase.cautionBoost * 0.4 + range.strongWeight * 0.08, 0.04, 0.9);
        return applyAdaptationToPlan(plan, ctx, hand, line, adaptation);
    }

    function decidePreflop(ctx, profile, plan, range, adaptation) {
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
            if (plan.archetype === 'bluff-pressure' && Math.random() < clamp(plan.bluff + range.pressureWindow * 0.18 + (adaptation?.pressureBias || 0) * 0.72 - (adaptation?.respectBias || 0) * 0.36, 0.02, 0.72)) {
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
            if (facingLarge && strength < 0.8 && (range.strongWeight >= 0.4 || (adaptation?.respectBias || 0) >= 0.16 || Math.random() < 0.26)) return { type: 'call', plan };
            const style = profile.aggressive || profile.limpy ? 'squeeze' : 'value';
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.2 }, style), plan };
        }

        if (plan.archetype === 'semi-bluff') {
            if ((pair || suited || connected) && price <= 0.28) {
                if ((profile.folder || range.pressureWindow >= 0.58 || (adaptation?.pressureBias || 0) >= 0.12) && Math.random() < 0.22 + range.pressureWindow * 0.12 + (adaptation?.pressureBias || 0) * 0.34) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, { wetness: 0.18 }, 'bluff'), plan };
                }
                return { type: 'call', plan };
            }
        }

        if (plan.archetype === 'bluff-pressure') {
            if ((profile.folder || range.pressureWindow >= 0.56) && blockerAce && Math.random() < clamp(plan.bluff + range.pressureWindow * 0.16, 0.02, 0.7)) {
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

    function decidePostflop(ctx, profile, texture, line, plan, range, adaptation) {
        const hand = getHandProfile(ctx);
        const potOdds = ctx.toCall > 0 ? ctx.toCall / Math.max(1, ctx.pot + ctx.toCall) : 0;
        const spr = ratio(ctx.effectiveStack, Math.max(1, ctx.pot), 3.5);
        const leverage = clamp(
            (texture.wetness * 0.4) +
            (profile.folder ? 0.12 : 0) +
            (line.aiHasInitiative ? 0.1 : 0) +
            range.pressureWindow * 0.22 +
            (adaptation?.pressureBias || 0) * 0.26 -
            (adaptation?.respectBias || 0) * 0.18 -
            range.strongWeight * 0.12,
            0,
            0.84
        );
        const semiBluffReady = hand.comboDraw || (hand.flushDraw && hand.straightDraw.gutshot) || hand.straightDraw.openEnded || hand.nutFlushDraw;
        const bluffCatchWindow = profile.aggressive || profile.bluffy || range.bluffCatchWindow >= 0.22 || (adaptation?.bluffCatchBias || 0) >= 0.14;

        if (ctx.toCall === 0) {
            if (hand.monster) {
                if ((plan.archetype === 'trap' || adaptation?.probeHappy) && profile.aggressive && texture.wetness < 0.34 && Math.random() < 0.24 + (adaptation?.trapBias || 0) * 0.3) return { type: 'check', plan };
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, texture.wetness > 0.55 ? 'heavyValue' : 'value'), plan };
            }

            if (hand.strongMade) {
                if (hand.topPairTopKicker || hand.overpair || texture.wetness >= 0.44 || plan.pressure >= 0.6 || range.drawWeight >= 0.28 || (adaptation?.valueBias || 0) >= 0.14) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'value'), plan };
                }
                if (profile.aggressive && Math.random() < 0.2) return { type: 'check', plan };
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'thinValue'), plan };
            }

            if (semiBluffReady && (plan.archetype === 'semi-bluff' || profile.folder || line.humanChecksThisStreet > 0 || line.aiHasInitiative)) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'semibluff'), plan };
            }

            if (hand.air) {
                const bluffWindow = leverage
                    + (texture.wetness < 0.34 ? 0.14 : 0)
                    + (profile.tight ? 0.08 : 0)
                    + plan.bluff * 0.4
                    + range.pressureWindow * 0.18
                    + (adaptation?.pressureBias || 0) * 0.36
                    - (adaptation?.respectBias || 0) * 0.32
                    - range.strongWeight * 0.12;
                if (Math.random() < bluffWindow) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
                }
            }

            if (hand.showdownValue && (profile.passive || texture.wetness < 0.36 || range.valueWindow >= 0.62 || (adaptation?.valueBias || 0) >= 0.14)) {
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
            if (texture.wetness >= 0.5 || profile.sticky || range.drawWeight >= 0.28) {
                if (Math.random() < (0.28 + plan.pressure * 0.18)) return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'value'), plan };
            }
            if (hand.equity >= potOdds - 0.02) return { type: 'call', plan };
        }

        if (semiBluffReady) {
            if ((hand.equity >= potOdds - 0.05) || ctx.toCall <= ctx.bigBlind * 4) {
                if (((profile.folder || ctx.street !== 'river') || range.pressureWindow >= 0.54) && Math.random() < (0.22 + plan.pressure * 0.24 + range.pressureWindow * 0.18)) {
                    return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'semibluff'), plan };
                }
                return { type: 'call', plan };
            }
        }

        if (hand.showdownValue) {
            if (ctx.street === 'river' && bluffCatchWindow && potOdds <= 0.3 + (adaptation?.bluffCatchBias || 0) * 0.4) return { type: 'call', plan };
            if (ctx.street !== 'river' && hand.equity >= potOdds + 0.03) return { type: 'call', plan };
        }

        if (hand.air && (profile.folder || range.pressureWindow >= 0.58) && line.humanAggThisStreet === 1 && ctx.street !== 'river' && (adaptation?.respectBias || 0) < 0.2 && Math.random() < (0.06 + plan.bluff * 0.18 + range.pressureWindow * 0.14 + (adaptation?.pressureBias || 0) * 0.24)) {
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
        }

        if (bluffCatchWindow && ctx.street === 'river' && potOdds <= 0.18 && profile.bluffy) {
            return { type: 'call', plan };
        }

        return { type: 'fold', plan };
    }

    function decideRiver(ctx, profile, texture, line, plan, range, adaptation) {
        const hand = getHandProfile(ctx);
        const potOdds = ctx.toCall > 0 ? ctx.toCall / Math.max(1, ctx.pot + ctx.toCall) : 0;
        const pressureBias = plan.pressure * 0.18 + range.pressureWindow * 0.14 + (adaptation?.pressureBias || 0) * 0.22;
        const bluffBias = plan.bluff * 0.28 + range.pressureWindow * 0.1 - range.strongWeight * 0.08 + (adaptation?.pressureBias || 0) * 0.18 - (adaptation?.respectBias || 0) * 0.24;

        if (ctx.toCall === 0) {
            if (hand.monster) {
                return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, plan.archetype === 'trap' ? 'heavyValue' : 'value'), plan };
            }

            if (hand.strongMade) {
                if (profile.station || profile.sticky || profile.bluffy || range.valueWindow >= 0.64 || (adaptation?.valueBias || 0) >= 0.14) {
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
            if ((profile.bluffy || profile.aggressive || range.bluffCatchWindow >= 0.24 || (adaptation?.bluffCatchBias || 0) >= 0.16) && potOdds <= 0.3 + pressureBias + (adaptation?.bluffCatchBias || 0) * 0.46) return { type: 'call', plan };
            if (profile.station && hand.topPair && potOdds <= 0.24) return { type: 'call', plan };
            return { type: 'fold', plan };
        }

        if (hand.showdownValue) {
            if ((profile.bluffy || profile.aggressive || range.bluffCatchWindow >= 0.32 || (adaptation?.bluffCatchBias || 0) >= 0.18) && potOdds <= 0.16 + pressureBias + (adaptation?.bluffCatchBias || 0) * 0.4) {
                return { type: 'call', plan };
            }
            return { type: 'fold', plan };
        }

        if (plan.archetype === 'bluff-pressure' && (profile.folder || range.pressureWindow >= 0.58) && (adaptation?.respectBias || 0) < 0.22 && ctx.toCall <= ctx.bigBlind * 5 && Math.random() < 0.08 + bluffBias) {
            return { type: 'raise', amount: chooseRaiseSize(ctx, profile, texture, 'bluff'), plan };
        }

        return { type: 'fold', plan };
    }

    function decide(ctx) {
        const profile = getPlayerProfile(ctx.stats, ctx.reads);
        const adaptation = getAdaptationProfile(ctx.reads);
        const phase = getMatchPhase(ctx);
        const texture = getBoardTexture(ctx.board);
        const line = getLineProfile(ctx);
        const hand = getHandProfile(ctx);
        const range = estimateHumanRange(ctx, profile, texture, line, adaptation);
        const plan = refinePlan(ctx, profile, texture, line, hand, phase, range, adaptation);
        let decision;

        if (ctx.street === 'preflop') {
            decision = decidePreflop(ctx, profile, plan, range, adaptation);
        } else if (ctx.street === 'river') {
            decision = decideRiver(ctx, profile, texture, line, plan, range, adaptation);
        } else {
            decision = decidePostflop(ctx, profile, texture, line, plan, range, adaptation);
        }

        return {
            ...decision,
            plan,
            reasoning: buildReasoning(ctx, plan, hand, range, decision, adaptation)
        };
    }

    window.BBPokerAI = {
        decide
    };
})();
