import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const configSpy = vi.fn();

vi.mock("../../client/GameComponents/GameConfiguration.tsx", () => ({
    default: (props: any) => {
        configSpy(props);
        return <div data-testid="game-configuration" />;
    }
}));

import GameSettingsModal from "../../client/GameComponents/GameSettingsModal";

describe("the <GameSettingsModal /> component", () => {
    let baseProps: any;

    beforeEach(() => {
        configSpy.mockClear();
        baseProps = {
            show: true,
            thisPlayer: {
                name: "Me",
                cardPiles: { hand: [] },
                provinces: { one: [], two: [], three: [], four: [] },
                promptedActionWindows: { phase1: true },
                timerSettings: { showTimer: false },
                optionSettings: { foo: "bar" }
            },
            onClose: vi.fn(),
            onPromptedActionWindowToggle: vi.fn(),
            onTimerSettingToggle: vi.fn(),
            onOptionSettingToggle: vi.fn()
        };
    });

    it("renders the modal visible when show is true", () => {
        render(<GameSettingsModal { ...baseProps } />);
        const modal = document.getElementById("settings-modal");
        expect(modal?.classList.contains("in")).toBe(true);
        expect((modal as HTMLElement).style.display).toBe("block");
    });

    it("hides the modal and omits the backdrop when show is false", () => {
        baseProps.show = false;
        const { container } = render(<GameSettingsModal { ...baseProps } />);
        const modal = document.getElementById("settings-modal");
        expect(modal?.classList.contains("in")).toBe(false);
        expect((modal as HTMLElement).style.display).toBe("none");
        expect(container.querySelector(".modal-backdrop")).toBeNull();
    });

    it("invokes onClose when the close button is clicked", () => {
        render(<GameSettingsModal { ...baseProps } />);
        fireEvent.click(screen.getByLabelText("Close"));
        expect(baseProps.onClose).toHaveBeenCalledOnce();
    });

    it("invokes onClose when the backdrop is clicked", () => {
        const { container } = render(<GameSettingsModal { ...baseProps } />);
        fireEvent.click(container.querySelector(".modal-backdrop") as Element);
        expect(baseProps.onClose).toHaveBeenCalledOnce();
    });

    it("hands the player's action windows + timer + option settings to GameConfiguration", () => {
        render(<GameSettingsModal { ...baseProps } />);
        const props = configSpy.mock.calls[0][0];
        expect(props.actionWindows).toBe(baseProps.thisPlayer.promptedActionWindows);
        expect(props.timerSettings).toBe(baseProps.thisPlayer.timerSettings);
        expect(props.optionSettings).toBe(baseProps.thisPlayer.optionSettings);
    });

    it("wires toggle handlers to GameConfiguration", () => {
        render(<GameSettingsModal { ...baseProps } />);
        const props = configSpy.mock.calls[0][0];
        expect(props.onToggle).toBe(baseProps.onPromptedActionWindowToggle);
        expect(props.onTimerSettingToggle).toBe(baseProps.onTimerSettingToggle);
        expect(props.onOptionSettingToggle).toBe(baseProps.onOptionSettingToggle);
    });
});
