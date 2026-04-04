let recording = [];
let hiddenInfo = [];
let isRecording = false;

export function startRecording() {
    if(isRecording) {
        return;
    }
    recording = [];
    hiddenInfo = [];
    isRecording = true;
}

export function recordState(gameState) {
    if(!isRecording) {
        return;
    }

    recording.push({
        state: JSON.parse(JSON.stringify(gameState)),
        timestamp: Date.now()
    });
}

export function setHiddenInfo(data) {
    hiddenInfo = data;
}

export function getRecording() {
    return recording;
}

export function getHiddenInfo() {
    return hiddenInfo;
}

export function clearRecording() {
    recording = [];
    hiddenInfo = [];
    isRecording = false;
}
