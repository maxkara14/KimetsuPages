import crypto from 'node:crypto';

const REQUIRED_PROGRESS_COUNT = 5;
const DEFAULT_SECRET_WORD = '\u043b\u043e\u0441\u043e\u0441\u044c';
const DEFAULT_CODE_PREFIX = 'L0N4_F1SHER_SECRET';

function json(statusCode, payload) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify(payload)
    };
}

function normalizeWord(value) {
    return String(value || '').trim().toLowerCase();
}

function hasRequiredProgress(progress) {
    if (!Array.isArray(progress)) return false;

    const unique = new Set(
        progress
            .map((item) => Number(item))
            .filter((item) => Number.isInteger(item) && item >= 0 && item < REQUIRED_PROGRESS_COUNT)
    );

    return unique.size === REQUIRED_PROGRESS_COUNT;
}

function generateProtectedCode() {
    const prefix = process.env.TERMINAL_CODE_PREFIX || DEFAULT_CODE_PREFIX;
    const stamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
    const nonce = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${stamp}${nonce}`;
}

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return json(405, { ok: false, message: 'METHOD_NOT_ALLOWED' });
    }

    let payload = {};
    try {
        payload = JSON.parse(event.body || '{}');
    } catch {
        return json(400, { ok: false, message: 'INVALID_JSON' });
    }

    const secretWord = normalizeWord(process.env.TERMINAL_SECRET_WORD || DEFAULT_SECRET_WORD);
    const inputWord = normalizeWord(payload.word);

    if (!hasRequiredProgress(payload.progress)) {
        return json(403, { ok: false, message: 'QUEST_INCOMPLETE' });
    }

    if (inputWord !== secretWord) {
        return json(403, { ok: false, message: 'INVALID_COMBINATION' });
    }

    return json(200, {
        ok: true,
        code: generateProtectedCode()
    });
}
