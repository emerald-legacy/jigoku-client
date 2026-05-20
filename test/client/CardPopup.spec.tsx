import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const cardSpy = vi.fn();

vi.mock("../../client/GameComponents/Card.tsx", () => ({
    default: (props: any) => {
        cardSpy(props);
        return <div data-testid="popup-card" data-facedown={ String(!!props.card.facedown) }>{ props.card.name || "facedown" }</div>;
    }
}));

import CardPopup from "../../client/GameComponents/CardPopup";

describe("the <CardPopup /> component", () => {
    let baseProps: any;

    beforeEach(() => {
        cardSpy.mockClear();
        baseProps = {
            attachments: [
                { uuid: "a1", name: "Ember", isDynasty: false, isConflict: true },
                { uuid: "a2", name: "Spark", isDynasty: true, isConflict: false }
            ],
            title: "Popup title",
            popupLocation: "bottom",
            orientation: "vertical",
            isMe: true,
            source: "play area",
            size: "normal",
            disableMouseOver: false,
            onCloseClick: vi.fn(),
            onCardClick: vi.fn(),
            onSelectCard: vi.fn(),
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn(),
            onDragDrop: vi.fn()
        };
    });

    it("displays the supplied title", () => {
        render(<CardPopup { ...baseProps } />);
        expect(screen.getByText("Popup title")).toBeInTheDocument();
    });

    it("renders a popup card per attachment when isMe is true", () => {
        render(<CardPopup { ...baseProps } />);
        const cards = screen.getAllByTestId("popup-card");
        expect(cards).toHaveLength(2);
        expect(cards.every((c: HTMLElement) => c.dataset.facedown === "false")).toBe(true);
    });

    it("renders attachments facedown when isMe is false", () => {
        baseProps.isMe = false;
        render(<CardPopup { ...baseProps } />);
        const cards = screen.getAllByTestId("popup-card");
        expect(cards.every((c: HTMLElement) => c.dataset.facedown === "true")).toBe(true);
    });

    it("invokes onCloseClick when the close button is clicked", () => {
        const { container } = render(<CardPopup { ...baseProps } />);
        fireEvent.click(container.querySelector(".close-button") as Element);
        expect(baseProps.onCloseClick).toHaveBeenCalledOnce();
    });

    it("invokes onSelectCard when the 'Select Card' button is clicked", () => {
        render(<CardPopup { ...baseProps } />);
        fireEvent.click(screen.getByText("Select Card"));
        expect(baseProps.onSelectCard).toHaveBeenCalledOnce();
    });

    it("invokes onCardClick with the displayed card when a popup card fires its onClick", () => {
        render(<CardPopup { ...baseProps } />);
        const ember = cardSpy.mock.calls.find(([p]: any[]) => p.card.uuid === "a1")?.[0];
        ember.onClick();
        expect(baseProps.onCardClick).toHaveBeenCalledExactlyOnceWith(baseProps.attachments[0]);
    });

    it("uses arrow class 'arrow lg up' by default and switches to 'down' when popupLocation is 'top'", () => {
        const { container, rerender } = render(<CardPopup { ...baseProps } popupLocation="bottom" />);
        expect(container.querySelector(".arrow.lg.up")).not.toBeNull();

        rerender(<CardPopup { ...baseProps } popupLocation="top" />);
        expect(container.querySelector(".arrow.lg.down")).not.toBeNull();
    });

    it("uses 'arrow lg left' when the parent card is rendered horizontally", () => {
        const { container } = render(<CardPopup { ...baseProps } orientation="horizontal" />);
        expect(container.querySelector(".arrow.lg.left")).not.toBeNull();
    });

    it("renders no popup cards when the attachment list is empty", () => {
        baseProps.attachments = [];
        render(<CardPopup { ...baseProps } />);
        expect(screen.queryByTestId("popup-card")).toBeNull();
    });
});
