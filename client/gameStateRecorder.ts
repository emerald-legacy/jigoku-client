import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import type { Card, GameState } from "./types/game";

export interface PlayerHiddenInfo {
    hand?: Card[];
    provinces?: Record<string, Card[]>;
    strongholdChildren?: Card[];
}

export type HiddenInfo = Record<string, PlayerHiddenInfo>;

/** Hidden card identities from state `seq` on, until the next change. */
export interface HiddenInfoChange {
    seq: number;
    info: HiddenInfo;
}

interface RecordedState {
    state: GameState;
    timestamp: number;
}

// A long game sends hundreds of ~60 KB states. They are kept as JSON and gzipped in
// batches, which takes a few KB per state instead of a full object copy.
const STATES_PER_BATCH = 10;

let batches: Uint8Array[] = [];
let pending: string[] = [];
let hiddenInfo: HiddenInfoChange[] = [];
let isRecording = false;
/** The replay ends with the winning state, even if the players play on. */
let reachedWin = false;

export function startRecording(): void {
    if(isRecording) {
        return;
    }
    batches = [];
    pending = [];
    hiddenInfo = [];
    isRecording = true;
    reachedWin = false;
}

export function recordState(gameState: GameState): void {
    if(!isRecording || reachedWin) {
        return;
    }

    const recorded: RecordedState = { state: gameState, timestamp: Date.now() };
    pending.push(JSON.stringify(recorded));
    reachedWin = !!gameState.winner;
    if(pending.length >= STATES_PER_BATCH || reachedWin) {
        compressPending();
    }
}

function compressPending(): void {
    if(pending.length === 0) {
        return;
    }
    batches.push(gzipSync(strToU8(`[${pending.join(",")}]`)));
    pending = [];
}

export function setHiddenInfo(data: HiddenInfoChange[]): void {
    if(!isRecording) {
        return;
    }
    hiddenInfo = data;
}

export function getRecording(): RecordedState[] {
    const states: RecordedState[] = [];
    for(const batch of batches) {
        const decoded: RecordedState[] = JSON.parse(strFromU8(gunzipSync(batch)));
        states.push(...decoded);
    }
    for(const state of pending) {
        states.push(JSON.parse(state));
    }
    return states;
}

export function getHiddenInfo(): HiddenInfoChange[] {
    return hiddenInfo;
}

export function clearRecording(): void {
    batches = [];
    pending = [];
    hiddenInfo = [];
    isRecording = false;
    reachedWin = false;
}
