import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import { getRecording, getHiddenInfo } from "../gameStateRecorder";
import type { GameState } from "../types/game";

const iconsConflict = ["military", "political"];
const iconsElement = ["air", "earth", "fire", "water", "void"];
const iconsClan = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];
const otherIcons = ["fate", "honor", "card", "cards"];

function fragmentToText(fragment: any): string {
    if(fragment === null || fragment === undefined) {
        return "";
    }

    if(typeof fragment === "string") {
        if(iconsConflict.includes(fragment) || iconsElement.includes(fragment) || iconsClan.includes(fragment) || otherIcons.includes(fragment)) {
            return `[${fragment}]`;
        }
        return fragment;
    }

    if(typeof fragment === "number") {
        return String(fragment);
    }

    if(Array.isArray(fragment)) {
        return fragment.map(fragmentToText).join("");
    }

    if(fragment.alert) {
        const alertText = fragmentToText(fragment.alert.message);
        if(fragment.alert.type === "endofround") {
            return `--- ${alertText} ---`;
        }
        return `[${fragment.alert.type.toUpperCase()}] ${alertText}`;
    }

    if(fragment.message) {
        return fragmentToText(fragment.message);
    }

    if(fragment.emailHash) {
        return fragment.name;
    }

    if(fragment.id) {
        if(fragment.type === "ring") {
            return `the ${fragment.element} ring`;
        }
        if(fragment.type === "player") {
            return fragment.name;
        }
        if(fragment.facedown) {
            return "a facedown card";
        }
        return fragment.name || fragment.label || "";
    }

    if(fragment.name) {
        return fragment.name;
    }

    return "";
}

function messageToText(message: any): string {
    if(!message) {
        return "";
    }
    return fragmentToText(message);
}

export function buildGameLog(currentGame: GameState, downloadedBy?: string) {
    const players = Object.values(currentGame.players).map((p) => ({
        name: p.name,
        faction: p.faction?.name || p.faction?.value || "unknown"
    }));

    const lines = (currentGame.messages || []).map((entry) => messageToText(entry.message));
    const plainText = lines.filter((line) => line.length > 0).join("\n");

    const replayData = getRecording();
    const hiddenInfo = getHiddenInfo();

    let version = 1;
    if(replayData.length > 0) {
        version = hiddenInfo.length > 0 ? 3 : 2;
    }

    return {
        version,
        metadata: {
            gameName: currentGame.name,
            gameMode: currentGame.gameMode,
            winner: currentGame.winner || null,
            date: new Date().toISOString(),
            players: players,
            downloadedBy: downloadedBy || null
        },
        plainText: plainText,
        messages: currentGame.messages,
        replayData: replayData.length > 0 ? replayData : undefined,
        hiddenInfo: hiddenInfo.length > 0 ? hiddenInfo : undefined
    };
}

export function downloadGameLog(currentGame: GameState, downloadedBy?: string): void {
    const log = buildGameLog(currentGame, downloadedBy);
    const json = JSON.stringify(log);
    const compressed = gzipSync(strToU8(json));
    const blob = new Blob([compressed], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const sanitize = (s: string) => (s || "").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
    const gameName = sanitize(log.metadata.gameName);
    const playerParts = log.metadata.players
        .map((p) => `${sanitize(p.name)}-${sanitize(p.faction)}`)
        .join("_vs_");

    const filename = `${date}_${gameName}_${playerParts}.json.gz`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function parseGameLog(arrayBuffer: ArrayBuffer) {
    let json: string;
    try {
        const decompressed = gunzipSync(new Uint8Array(arrayBuffer));
        json = strFromU8(decompressed);
    } catch(_e) {
        const decoder = new TextDecoder();
        json = decoder.decode(arrayBuffer);
    }

    const log = JSON.parse(json);

    if(!log.version || !log.metadata) {
        throw new Error("Invalid game log file");
    }

    if(log.replayData && log.replayData.length > 0) {
        let accumulated: any[] = [];
        for(let i = 0; i < log.replayData.length; i++) {
            const entry = log.replayData[i];
            const state = entry.state;
            if(state.newMessages && accumulated.length > 0) {
                accumulated = accumulated.concat(state.messages || []);
            } else {
                accumulated = [...(state.messages || [])];
            }
            entry.accumulatedMessages = [...accumulated];
            delete state.messages;
            delete state.newMessages;

            // Attach hidden info snapshot to each replay entry if available
            if(log.hiddenInfo && log.hiddenInfo[i]) {
                entry.hiddenInfo = log.hiddenInfo[i];
            }
        }
        // Remove top-level hiddenInfo after distributing to entries
        delete log.hiddenInfo;
    }

    return log;
}
