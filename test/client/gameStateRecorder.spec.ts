import { describe, it, expect, vi, beforeEach } from "vitest";

const { gzipSpy } = vi.hoisted(() => ({ gzipSpy: vi.fn() }));

vi.mock("fflate", async (importOriginal) => {
    const actual = await importOriginal<typeof import("fflate")>();
    return {
        ...actual,
        gzipSync: (...args: Parameters<typeof actual.gzipSync>) => {
            gzipSpy();
            return actual.gzipSync(...args);
        }
    };
});

import { clearRecording, getRecording, recordState, startRecording } from "../../client/gameStateRecorder";
import type { GameState } from "../../client/types/game";

function state(seq: number, winner?: string): GameState {
    return { id: "game-1", name: "Game", started: true, players: {}, spectators: [], messages: [], stateSeq: seq, winner };
}

function recordedSeqs(): (number | undefined)[] {
    return getRecording().map((recorded) => recorded.state.stateSeq);
}

describe("gameStateRecorder", () => {
    beforeEach(() => {
        clearRecording();
        gzipSpy.mockClear();
        startRecording();
    });

    it("returns every recorded state in order, across compressed batches and the open batch", () => {
        for(let seq = 1; seq <= 23; seq++) {
            recordState(state(seq));
        }

        expect(recordedSeqs()).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    });

    it("compresses the states once a batch of ten is full", () => {
        for(let seq = 1; seq <= 9; seq++) {
            recordState(state(seq));
        }
        expect(gzipSpy).not.toHaveBeenCalled();

        recordState(state(10));
        expect(gzipSpy).toHaveBeenCalledTimes(1);
    });

    it("keeps a snapshot, unaffected by later changes to the state object", () => {
        const live = state(1);
        recordState(live);
        live.stateSeq = 99;

        expect(recordedSeqs()).toEqual([1]);
    });

    it("ends with the winning state and compresses it right away", () => {
        recordState(state(1));
        recordState(state(2, "alice"));
        recordState(state(3, "alice"));

        expect(recordedSeqs()).toEqual([1, 2]);
        expect(gzipSpy).toHaveBeenCalledTimes(1);
    });

    it("forgets everything on clear", () => {
        for(let seq = 1; seq <= 12; seq++) {
            recordState(state(seq));
        }
        clearRecording();

        expect(getRecording()).toEqual([]);
    });
});
