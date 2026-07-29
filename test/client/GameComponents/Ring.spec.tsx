import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("../../../client/GameComponents/CardCounters.tsx", () => ({
    default: () => <div data-testid="card-counters" />
}));

vi.mock("../../../client/GameComponents/CardMenu.tsx", () => ({
    default: () => <div data-testid="card-menu" />
}));

import Ring from "../../../client/GameComponents/Ring";

const claimAnimation = (element: string, playerName: string) => ({
    type: "claim" as const,
    element,
    playerName
});

describe("the <Ring /> component claim flash", () => {
    let onClaimAnimationEnd: ReturnType<typeof vi.fn>;
    let baseProps: any;

    beforeEach(() => {
        vi.useFakeTimers();
        onClaimAnimationEnd = vi.fn();
        baseProps = {
            owner: "Player1",
            ring: { element: "fire", conflictType: "military", claimed: true, claimedBy: "Player1" },
            onClaimAnimationEnd
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const ringElement = (container: HTMLElement) => container.querySelector(".ring.no-highlight") as HTMLElement;

    it("should not flash when no claim animation is pending", () => {
        const { container } = render(<Ring { ...baseProps } pendingAnimations={ [] } />);

        expect(ringElement(container).className).not.toContain("ring-claim-flash");
    });

    it("should flash while the matching claim animation is pending", () => {
        const { container } = render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player1")] } />);

        expect(ringElement(container).className).toContain("ring-claim-flash");
    });

    it("should not flash for another ring's claim animation", () => {
        const { container } = render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("water", "Player1")] } />);

        expect(ringElement(container).className).not.toContain("ring-claim-flash");
    });

    it("should not flash for another player's claim animation", () => {
        const { container } = render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player2")] } />);

        expect(ringElement(container).className).not.toContain("ring-claim-flash");
    });

    it("should keep the animation pending until the burst has run", () => {
        render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player1")] } />);

        expect(onClaimAnimationEnd).not.toHaveBeenCalled();

        vi.advanceTimersByTime(2499);
        expect(onClaimAnimationEnd).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onClaimAnimationEnd).toHaveBeenCalledWith("fire", "Player1");
    });

    it("should clear the animation only once", () => {
        render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player1")] } />);

        vi.advanceTimersByTime(10000);

        expect(onClaimAnimationEnd).toHaveBeenCalledTimes(1);
    });

    it("should stop flashing once the animation is cleared from the store", () => {
        const { container, rerender } = render(
            <Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player1")] } />
        );
        expect(ringElement(container).className).toContain("ring-claim-flash");

        rerender(<Ring { ...baseProps } pendingAnimations={ [] } />);

        expect(ringElement(container).className).not.toContain("ring-claim-flash");
    });

    it("should not clear the animation after unmounting", () => {
        const { unmount } = render(<Ring { ...baseProps } pendingAnimations={ [claimAnimation("fire", "Player1")] } />);

        unmount();
        vi.advanceTimersByTime(5000);

        expect(onClaimAnimationEnd).not.toHaveBeenCalled();
    });
});
