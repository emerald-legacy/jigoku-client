import type { Card, GameState } from "./types/game";

export interface PlayerHiddenInfo {
    hand?: Card[];
    provinces?: Record<string, Card[]>;
    strongholdChildren?: Card[];
}

export type HiddenInfo = Record<string, PlayerHiddenInfo>;

interface RecordedState {
    state: GameState;
    timestamp: number;
}

let recording: RecordedState[] = [];
let hiddenInfo: HiddenInfo[] = [];
let isRecording = false;

export function startRecording(): void {
    if(isRecording) {
        return;
    }
    recording = [];
    hiddenInfo = [];
    isRecording = true;
}

export function recordState(gameState: GameState): void {
    if(!isRecording) {
        return;
    }

    recording.push({
        state: structuredClone(gameState),
        timestamp: Date.now()
    });
}

export function setHiddenInfo(data: HiddenInfo[]): void {
    if(!isRecording) {
        return;
    }
    hiddenInfo = data;
}

export function getRecording(): RecordedState[] {
    return recording;
}

export function getHiddenInfo(): HiddenInfo[] {
    return hiddenInfo;
}

export function clearRecording(): void {
    recording = [];
    hiddenInfo = [];
    isRecording = false;
}
