import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const statsBoxSpy = vi.fn();
const ringRowSpy = vi.fn();

vi.mock("../../client/Avatar.tsx", () => ({
    default: (props: any) => <div data-testid="avatar" data-hash={ props.emailHash } />
}));

vi.mock("../../client/GameComponents/HonorFan.tsx", () => ({
    default: (props: any) => <div data-testid="honor-fan" data-value={ props.value } />
}));

vi.mock("../../client/GameComponents/PlayerStatsBox.tsx", () => ({
    default: (props: any) => {
        statsBoxSpy(props);
        return <div data-testid={ props.otherPlayer ? "stats-other" : "stats-me" } />;
    }
}));

vi.mock("../../client/GameComponents/CenterBar.tsx", () => ({
    RingRow: (props: any) => {
        ringRowSpy(props);
        return <div data-testid="ring-row" data-owner={ props.owner } data-classname={ props.className } />;
    }
}));

import PlayerSidebar from "../../client/GameComponents/PlayerSidebar";

describe("the <PlayerSidebar /> component", () => {
    let baseProps: any;

    beforeEach(() => {
        statsBoxSpy.mockClear();
        ringRowSpy.mockClear();
        baseProps = {
            thisPlayer: {
                name: "Me",
                user: { username: "MeUser", emailHash: "me-hash" },
                clock: { mode: "off" },
                stats: { fate: 4, honor: 7 },
                cardPiles: { hand: [{ uuid: "1" }, { uuid: "2" }] },
                hideProvinceDeck: false,
                showBid: 1
            },
            otherPlayer: {
                name: "Opp",
                user: { username: "OppUser", emailHash: "opp-hash" },
                clock: { mode: "off" },
                stats: { fate: 2, honor: 3 },
                cardPiles: { hand: [{ uuid: "x" }] },
                showBid: 2
            },
            cardSize: "normal",
            showRingEffects: true,
            gameMode: "stronghold",
            rings: { air: {}, earth: {}, fire: {}, void: {}, water: {} },
            spectating: false,
            manualMode: false,
            boundActions: { someBoundAction: vi.fn() },
            onRingClick: vi.fn(),
            onRingMenuItemClick: vi.fn()
        };
    });

    it("renders both player nameplates with usernames", () => {
        render(<PlayerSidebar { ...baseProps } />);
        expect(screen.getByText("MeUser")).toBeInTheDocument();
        expect(screen.getByText("OppUser")).toBeInTheDocument();
    });

    it("falls back to 'Noone' when otherPlayer is absent", () => {
        baseProps.otherPlayer = undefined;
        render(<PlayerSidebar { ...baseProps } />);
        expect(screen.getByText("Noone")).toBeInTheDocument();
    });

    it("renders one RingRow per side with correct owner and classname", () => {
        render(<PlayerSidebar { ...baseProps } />);
        const calls = ringRowSpy.mock.calls.map(([p]: any[]) => ({ owner: p.owner, cls: p.className }));
        expect(calls).toEqual([
            { owner: "Opp", cls: "claimed-pool their-pool normal" },
            { owner: "Me", cls: "claimed-pool my-pool normal" }
        ]);
    });

    it("renders HonorFan twice when thisPlayer hides their province deck", () => {
        baseProps.thisPlayer.hideProvinceDeck = true;
        render(<PlayerSidebar { ...baseProps } />);
        expect(screen.getAllByTestId("honor-fan")).toHaveLength(2);
    });

    it("does not render HonorFan when province deck is visible", () => {
        render(<PlayerSidebar { ...baseProps } />);
        expect(screen.queryByTestId("honor-fan")).toBeNull();
    });

    it("forwards spectating + manualMode into showControls on the me stats box", () => {
        baseProps.spectating = false;
        baseProps.manualMode = true;
        render(<PlayerSidebar { ...baseProps } />);
        const meCall = statsBoxSpy.mock.calls.find(([p]: any[]) => !p.otherPlayer);
        expect(meCall?.[0].showControls).toBe(true);
    });

    it("disables showControls when spectating even in manual mode", () => {
        baseProps.spectating = true;
        baseProps.manualMode = true;
        render(<PlayerSidebar { ...baseProps } />);
        const meCall = statsBoxSpy.mock.calls.find(([p]: any[]) => !p.otherPlayer);
        expect(meCall?.[0].showControls).toBe(false);
    });

    it("only exposes boundActions to the me-side stats box, never the opponent", () => {
        render(<PlayerSidebar { ...baseProps } />);
        const meProps = statsBoxSpy.mock.calls.find(([p]: any[]) => !p.otherPlayer)?.[0];
        const oppProps = statsBoxSpy.mock.calls.find(([p]: any[]) => p.otherPlayer)?.[0];
        expect(meProps.someBoundAction).toBeDefined();
        expect(oppProps.someBoundAction).toBeUndefined();
    });

    it("lets the me stats box dispatch a bound action and routes it back to the caller", () => {
        render(<PlayerSidebar { ...baseProps } />);
        const meProps = statsBoxSpy.mock.calls.find(([p]: any[]) => !p.otherPlayer)?.[0];
        meProps.someBoundAction("payload");
        expect(baseProps.boundActions.someBoundAction).toHaveBeenCalledExactlyOnceWith("payload");
    });
});
