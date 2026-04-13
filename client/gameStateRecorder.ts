import type { GameState } from "./types/game";

interface RecordedState {
    state: any;
    timestamp: number;
}

let recording: RecordedState[] = [];
let hiddenInfo: any[] = [];
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
        state: JSON.parse(JSON.stringify(gameState)),
        timestamp: Date.now()
    });
}

export function setHiddenInfo(data: any[]): void {
    if(!isRecording) {
        return;
    }
    hiddenInfo = data;
}

export function getRecording(): RecordedState[] {
    return recording;
}

export function getHiddenInfo(): any[] {
    return hiddenInfo;
}

export function clearRecording(): void {
    recording = [];
    hiddenInfo = [];
    isRecording = false;
}
