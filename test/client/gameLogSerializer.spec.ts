import { describe, it, expect, beforeEach } from "vitest";
import { gzipSync, strToU8 } from "fflate";

import { buildGameLog, parseGameLog } from "../../client/GameComponents/gameLogSerializer";
import { clearRecording, recordState, setHiddenInfo, startRecording } from "../../client/gameStateRecorder";
import type { HiddenInfo, HiddenInfoChange } from "../../client/gameStateRecorder";
import type { GameState } from "../../client/types/game";

function hand(...ids: string[]): HiddenInfo {
    return { alice: { hand: ids.map((id) => ({ id, uuid: id, name: id, facedown: false })) } };
}

function gameState(stateSeq: number): GameState {
    return {
        id: "g1",
        name: "Test",
        started: true,
        players: {},
        spectators: [],
        messages: [],
        stateSeq
    };
}

function toFile(log: unknown): ArrayBuffer {
    return new Uint8Array(gzipSync(strToU8(JSON.stringify(log)))).buffer;
}

describe("game log hidden info", () => {
    beforeEach(() => {
        clearRecording();
    });

    it("pairs each recorded state with the hidden-info change in effect at its stateSeq", () => {
        // the page was reloaded: this client recorded only states 5 to 7
        startRecording();
        for(const seq of [5, 6, 7]) {
            recordState(gameState(seq));
        }
        const changes: HiddenInfoChange[] = [
            { seq: 1, info: hand("a") },
            { seq: 4, info: hand("b") },
            { seq: 7, info: hand("c") }
        ];
        setHiddenInfo(changes);

        const log = buildGameLog(gameState(7), "alice");
        expect(log.version).toBe(4);
        expect(log.hiddenInfo).toEqual(changes);

        const parsed = parseGameLog(toFile(log));
        expect(parsed.replayData.map((entry: { hiddenInfo?: HiddenInfo }) => entry.hiddenInfo)).toEqual([hand("b"), hand("b"), hand("c")]);
    });

    it("ends the recording with the winning state", () => {
        startRecording();
        recordState(gameState(1));
        recordState({ ...gameState(2), winner: "alice" });
        recordState({ ...gameState(3), stateSeq: undefined, winner: "alice" });
        setHiddenInfo([{ seq: 1, info: hand("a") }, { seq: 2, info: hand("b") }]);

        const parsed = parseGameLog(toFile(buildGameLog(gameState(2))));
        expect(parsed.replayData.map((entry: { hiddenInfo?: HiddenInfo }) => entry.hiddenInfo)).toEqual([hand("a"), hand("b")]);
    });

    it("leaves a state without a stateSeq without hidden info", () => {
        startRecording();
        recordState({ ...gameState(1), stateSeq: undefined });
        recordState(gameState(2));
        setHiddenInfo([{ seq: 1, info: hand("a") }]);

        const parsed = parseGameLog(toFile(buildGameLog(gameState(2))));
        expect(parsed.replayData.map((entry: { hiddenInfo?: HiddenInfo }) => entry.hiddenInfo)).toEqual([undefined, hand("a")]);
    });

    it("still pairs a version 3 log's entries by index", () => {
        const log = {
            version: 3,
            metadata: { players: [] },
            replayData: [{ state: gameState(1), timestamp: 0 }, { state: gameState(2), timestamp: 0 }],
            hiddenInfo: [hand("a"), hand("b")]
        };

        const parsed = parseGameLog(toFile(log));
        expect(parsed.replayData.map((entry: { hiddenInfo?: HiddenInfo }) => entry.hiddenInfo)).toEqual([hand("a"), hand("b")]);
    });
});
