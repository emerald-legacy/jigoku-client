import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import { getRecording } from '../gameStateRecorder.js';

const iconsConflict = ['military', 'political'];
const iconsElement = ['air', 'earth', 'fire', 'water', 'void'];
const iconsClan = ['crab', 'crane', 'dragon', 'lion', 'phoenix', 'scorpion', 'unicorn'];
const otherIcons = ['fate', 'honor', 'card', 'cards'];

/**
 * Convert a message fragment (as received from the server) to plain text.
 * Mirrors the rendering logic in Messages.jsx formatMessageText().
 */
function fragmentToText(fragment) {
    if(fragment === null || fragment === undefined) {
        return '';
    }

    if(typeof fragment === 'string') {
        if(iconsConflict.includes(fragment) || iconsElement.includes(fragment) || iconsClan.includes(fragment) || otherIcons.includes(fragment)) {
            return '[' + fragment + ']';
        }
        return fragment;
    }

    if(typeof fragment === 'number') {
        return String(fragment);
    }

    if(Array.isArray(fragment)) {
        return fragment.map(fragmentToText).join('');
    }

    if(fragment.alert) {
        const alertText = fragmentToText(fragment.alert.message);
        if(fragment.alert.type === 'endofround') {
            return '--- ' + alertText + ' ---';
        }
        return '[' + fragment.alert.type.toUpperCase() + '] ' + alertText;
    }

    if(fragment.message) {
        return fragmentToText(fragment.message);
    }

    if(fragment.emailHash) {
        return fragment.name;
    }

    if(fragment.id) {
        if(fragment.type === 'ring') {
            return 'the ' + fragment.element + ' ring';
        }
        if(fragment.type === 'player') {
            return fragment.name;
        }
        if(fragment.facedown) {
            return 'a facedown card';
        }
        return fragment.name || fragment.label || '';
    }

    if(fragment.name) {
        return fragment.name;
    }

    return '';
}

function messageToText(message) {
    if(!message) {
        return '';
    }
    return fragmentToText(message);
}

export function buildGameLog(currentGame) {
    const players = Object.values(currentGame.players).map((p) => ({
        name: p.name,
        faction: p.faction?.name || p.faction?.value || 'unknown'
    }));

    const lines = (currentGame.messages || []).map((entry) => messageToText(entry.message));
    const plainText = lines.filter((line) => line.length > 0).join('\n');

    const replayData = getRecording();

    return {
        version: replayData.length > 0 ? 2 : 1,
        metadata: {
            gameName: currentGame.name,
            gameMode: currentGame.gameMode,
            winner: currentGame.winner || null,
            date: new Date().toISOString(),
            players: players
        },
        plainText: plainText,
        messages: currentGame.messages,
        replayData: replayData.length > 0 ? replayData : undefined
    };
}

export function downloadGameLog(currentGame) {
    const log = buildGameLog(currentGame);
    const json = JSON.stringify(log);
    const compressed = gzipSync(strToU8(json));
    const blob = new Blob([compressed], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const timestamp = now.getFullYear() +
        '-' + String(now.getMonth() + 1).padStart(2, '0') +
        '-' + String(now.getDate()).padStart(2, '0') +
        '-' + String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

    const a = document.createElement('a');
    a.href = url;
    a.download = 'jigoku-log-' + timestamp + '.json.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function parseGameLog(arrayBuffer) {
    let json;
    try {
        // Try gzip decompression first (version 2)
        const decompressed = gunzipSync(new Uint8Array(arrayBuffer));
        json = strFromU8(decompressed);
    } catch {
        // Fall back to plain JSON (version 1)
        const decoder = new TextDecoder();
        json = decoder.decode(arrayBuffer);
    }

    const log = JSON.parse(json);

    if(!log.version || !log.metadata) {
        throw new Error('Invalid game log file');
    }

    // Pre-compute accumulated messages for each replay state
    if(log.replayData && log.replayData.length > 0) {
        let accumulated = [];
        for(const entry of log.replayData) {
            const state = entry.state;
            if(state.newMessages && accumulated.length > 0) {
                accumulated = accumulated.concat(state.messages || []);
            } else {
                accumulated = [...(state.messages || [])];
            }
            entry.accumulatedMessages = [...accumulated];
            // Clean up the state's message fields to save memory
            delete state.messages;
            delete state.newMessages;
        }
    }

    return log;
}
