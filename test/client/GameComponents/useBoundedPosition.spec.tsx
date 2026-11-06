import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { DraggableData, DraggableEvent } from "react-draggable";

import { useBoundedPosition, useViewportSize, type Bounds } from "../../../client/GameComponents/useBoundedPosition";

const dragTo = (x: number, y: number) => [{} as DraggableEvent, { x, y } as DraggableData] as const;

describe("useBoundedPosition", () => {
    it("starts at the initial position when it fits", () => {
        const { result } = renderHook(() => useBoundedPosition(() => ({ x: 100, y: 50 }), { left: 0, top: 0, right: 500, bottom: 400 }));

        expect(result.current.position).toEqual({ x: 100, y: 50 });
    });

    it("moves a panel back on screen when the bounds shrink (a rotated tablet)", () => {
        const { result, rerender } = renderHook(({ bounds }: { bounds: Bounds }) => useBoundedPosition(() => ({ x: 0, y: 0 }), bounds), {
            initialProps: { bounds: { left: 0, top: 0, right: 900, bottom: 600 } }
        });
        act(() => result.current.onStop(...dragTo(800, 500)));
        expect(result.current.position).toEqual({ x: 800, y: 500 });

        rerender({ bounds: { left: 0, top: 0, right: 300, bottom: 700 } });

        expect(result.current.position).toEqual({ x: 300, y: 500 });
    });

    it("keeps a panel wider than the window at the left edge instead of using inverted bounds", () => {
        // A 490px hand on a 390px phone: right = 390 - 490 = -100.
        const { result } = renderHook(() => useBoundedPosition(() => ({ x: -45, y: 400 }), { left: 0, top: 0, right: -100, bottom: 684 }));

        expect(result.current.bounds).toEqual({ left: 0, top: 0, right: 0, bottom: 684 });
        expect(result.current.position).toEqual({ x: 0, y: 400 });
    });
});

describe("useViewportSize", () => {
    it("follows window resizes", () => {
        const { result } = renderHook(() => useViewportSize());

        act(() => {
            Object.defineProperty(window, "innerWidth", { configurable: true, value: 4000 });
            window.dispatchEvent(new Event("resize"));
        });

        expect(result.current.width).toBe(4000);
    });
});
