let recording = [];
let isRecording = false;

export function startRecording() {
    if(isRecording) {
        return;
    }
    recording = [];
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

export function getRecording() {
    return recording;
}

export function clearRecording() {
    recording = [];
    isRecording = false;
}
