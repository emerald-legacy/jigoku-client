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

let recording: RecordedState[] = [];
let hiddenInfo: HiddenInfoChange[] = [];
let isRecording = false;
/** The replay ends with the winning state, even if the players play on. */
let reachedWin = false;

export function startRecording(): void {
    if(isRecording) {
        return;
    }
    recording = [];
    hiddenInfo = [];
    isRecording = true;
    reachedWin = false;
}

export function recordState(gameState: GameState): void {
    if(!isRecording || reachedWin) {
        return;
    }

    recording.push({
        state: structuredClone(gameState),
        timestamp: Date.now()
    });
    reachedWin = !!gameState.winner;
}

export function setHiddenInfo(data: HiddenInfoChange[]): void {
    if(!isRecording) {
        return;
    }
    hiddenInfo = data;
}

export function getRecording(): RecordedState[] {
    return recording;
}

export function getHiddenInfo(): HiddenInfoChange[] {
    return hiddenInfo;
}

export function clearRecording(): void {
    recording = [];
    hiddenInfo = [];
    isRecording = false;
    reachedWin = false;
}
