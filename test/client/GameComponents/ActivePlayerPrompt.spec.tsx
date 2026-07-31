import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

vi.mock("react-draggable", () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="draggable">{ children }</div>
}));

vi.mock("../../../client/GameComponents/AbilityTargeting.tsx", () => ({
    default: () => <div data-testid="ability-targeting" />
}));

vi.mock("../../../client/GameComponents/CardNameLookup.tsx", () => ({
    default: () => <div data-testid="card-name-lookup" />
}));

import ActivePlayerPrompt from "../../../client/GameComponents/ActivePlayerPrompt";
import type { Control } from "../../../client/types/game";

const timerUser = { settings: { windowTimer: 10 } };

describe("the <ActivePlayerPrompt /> window timer", () => {
    let onTimerExpired: ReturnType<typeof vi.fn>;
    let onButtonClick: ReturnType<typeof vi.fn>;
    let baseProps: any;

    beforeEach(() => {
        vi.useFakeTimers();
        onTimerExpired = vi.fn();
        onButtonClick = vi.fn();
        baseProps = {
            buttons: [
                { text: "Pass", command: "pass", timer: true },
                { text: "Trigger", command: "trigger" }
            ],
            phase: "conflict",
            title: "Any reactions?",
            user: timerUser,
            onButtonClick,
            onTimerExpired
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const progressWidth = () => (document.querySelector(".progress-bar") as HTMLElement | null)?.style.width;

    it("should show the countdown at full width before any tick", () => {
        render(<ActivePlayerPrompt { ...baseProps } />);

        expect(screen.getByText(/Auto passing in/)).toBeInTheDocument();
        expect(progressWidth()).toBe("100%");
    });

    it("should not show a timer when no button asks for one", () => {
        render(<ActivePlayerPrompt { ...baseProps } buttons={ [{ text: "Done", command: "done" }] } />);

        expect(screen.queryByText(/Auto passing in/)).not.toBeInTheDocument();
    });

    it("should not show a timer when the user has no window timer configured", () => {
        render(<ActivePlayerPrompt { ...baseProps } user={ { settings: {} } } />);

        expect(screen.queryByText(/Auto passing in/)).not.toBeInTheDocument();
    });

    it("should count down as time passes", () => {
        render(<ActivePlayerPrompt { ...baseProps } />);

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.getByText(/Auto passing in 6/)).toBeInTheDocument();
        expect(progressWidth()).toBe("60%");
    });

    it("should expire once the window has elapsed and hide the timer", () => {
        render(<ActivePlayerPrompt { ...baseProps } />);

        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(onTimerExpired).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Auto passing in/)).not.toBeInTheDocument();
    });

    it("should only expire once", () => {
        render(<ActivePlayerPrompt { ...baseProps } />);

        act(() => {
            vi.advanceTimersByTime(30000);
        });

        expect(onTimerExpired).toHaveBeenCalledTimes(1);
    });

    it("should cancel the timer when another button is clicked", () => {
        render(<ActivePlayerPrompt { ...baseProps } />);

        act(() => {
            screen.getByRole("button", { name: "Trigger" }).click();
        });

        expect(onButtonClick).toHaveBeenCalledWith("trigger", undefined, undefined, undefined);
        expect(screen.queryByText(/Auto passing in/)).not.toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(20000);
        });
        expect(onTimerExpired).not.toHaveBeenCalled();
    });

    it("should restart the countdown when a new prompt arrives", () => {
        const { rerender } = render(<ActivePlayerPrompt { ...baseProps } />);

        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(onTimerExpired).toHaveBeenCalledTimes(1);

        rerender(<ActivePlayerPrompt
            { ...baseProps }
            buttons={ [{ text: "Pass", command: "pass2", timer: true }] }
        />);

        expect(screen.getByText(/Auto passing in/)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(onTimerExpired).toHaveBeenCalledTimes(2);
    });

    it("should not fire after unmounting", () => {
        const { unmount } = render(<ActivePlayerPrompt { ...baseProps } />);

        unmount();
        act(() => {
            vi.advanceTimersByTime(20000);
        });

        expect(onTimerExpired).not.toHaveBeenCalled();
    });
});

describe("the <ActivePlayerPrompt /> targeting controls", () => {
    const control = (sourceUuid: string, sourceName: string): Control => ({
        type: "targeting",
        uuid: "prompt-uuid",
        source: { uuid: sourceUuid, name: sourceName },
        targets: []
    });

    it("should render one entry per control when they share a prompt uuid", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

        render(<ActivePlayerPrompt
            title="Any reactions?"
            controls={ [control("src-1", "Framework effect"), control("src-2", "Framework effect")] }
        />);

        expect(screen.getAllByTestId("ability-targeting")).toHaveLength(2);
        expect(error).not.toHaveBeenCalledWith(
            expect.stringContaining("same key"),
            expect.anything(),
            expect.anything()
        );

        error.mockRestore();
    });

    it("should drop stale controls when the next prompt has fewer", () => {
        const { rerender } = render(<ActivePlayerPrompt
            title="Any reactions?"
            controls={ [control("src-1", "Framework effect"), control("src-2", "Framework effect")] }
        />);

        rerender(<ActivePlayerPrompt
            title="Initiate an action"
            controls={ [] }
        />);

        expect(screen.queryAllByTestId("ability-targeting")).toHaveLength(0);
    });
});
