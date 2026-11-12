import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { replaceColons } = vi.hoisted(() => ({ replaceColons: vi.fn((text: string) => text) }));

vi.mock("emoji-js", () => ({
    default: class {
        replace_colons = replaceColons;
    }
}));

import Messages from "../../../client/GameComponents/Messages";
import type { GameMessage } from "../../../client/types/game";

function textMessage(date: string, text: string): GameMessage {
    return { date, message: [{ message: text }] };
}

describe("Messages", () => {
    beforeEach(() => {
        replaceColons.mockClear();
    });

    it("formats only the new message when the log grows", () => {
        const first = textMessage("1", "first");
        const second = textMessage("2", "second");
        const { rerender } = render(<Messages messages={ [first] } />);
        expect(replaceColons).toHaveBeenCalledTimes(1);

        rerender(<Messages messages={ [first, second] } />);

        expect(screen.getByText("first")).toBeTruthy();
        expect(screen.getByText("second")).toBeTruthy();
        expect(replaceColons).toHaveBeenCalledTimes(2);
        expect(replaceColons).toHaveBeenLastCalledWith("second");
    });

    it("calls the latest card hover handler without re-formatting the rows", () => {
        const cardMessage: GameMessage = { date: "1", message: [{ id: "hida-kisada", uuid: "card-1", name: "Hida Kisada", type: "card" }] };
        const firstHandler = vi.fn();
        const latestHandler = vi.fn();
        const { rerender } = render(<Messages messages={ [cardMessage] } onCardMouseOver={ firstHandler } />);

        rerender(<Messages messages={ [cardMessage] } onCardMouseOver={ latestHandler } />);
        fireEvent.mouseOver(screen.getByText("Hida Kisada"));

        expect(firstHandler).not.toHaveBeenCalled();
        expect(latestHandler).toHaveBeenCalledWith(cardMessage.message[0]);
    });
});
