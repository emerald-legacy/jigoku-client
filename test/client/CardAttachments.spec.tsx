import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const cardSpy = vi.fn();

vi.mock("../../client/GameComponents/Card.tsx", () => ({
    default: (props: any) => {
        cardSpy(props);
        return <div data-testid="card" data-card-id={ props.card.uuid }>{ props.card.name }</div>;
    }
}));

import CardAttachments from "../../client/GameComponents/CardAttachments";

describe("the <CardAttachments /> component", () => {
    let baseProps: any;

    beforeEach(() => {
        cardSpy.mockClear();
        baseProps = {
            attachments: [
                { uuid: "a1", name: "Ember", bowed: false },
                { uuid: "a2", name: "Spark", bowed: true }
            ],
            source: "play area",
            size: "normal",
            disableMouseOver: false,
            onMouseOver: vi.fn(),
            onMouseOut: vi.fn(),
            onClick: vi.fn(),
            onMenuItemClick: vi.fn()
        };
    });

    it("renders one Card per attachment", () => {
        render(<CardAttachments { ...baseProps } />);
        expect(screen.getAllByTestId("card")).toHaveLength(2);
        expect(screen.getByText("Ember")).toBeInTheDocument();
        expect(screen.getByText("Spark")).toBeInTheDocument();
    });

    it("renders nothing when the source is not an attachable zone", () => {
        baseProps.source = "hand";
        render(<CardAttachments { ...baseProps } />);
        expect(screen.queryByTestId("card")).toBeNull();
    });

    it("renders nothing when there are no attachments", () => {
        baseProps.attachments = [];
        render(<CardAttachments { ...baseProps } />);
        expect(screen.queryByTestId("card")).toBeNull();
    });

    it("accepts each of the five attachable sources", () => {
        const sources = ["play area", "province 1", "province 2", "province 3", "province 4", "stronghold province"];
        sources.forEach((source: string) => {
            const { unmount } = render(<CardAttachments { ...baseProps } source={ source } />);
            expect(screen.getAllByTestId("card")).toHaveLength(2);
            unmount();
        });
    });

    it("renders bowed attachments with the matching marginTop adjustment", () => {
        render(<CardAttachments { ...baseProps } />);
        const props = cardSpy.mock.calls.map(([p]: any[]) => p);
        const ember = props.find((p: any) => p.card.uuid === "a1");
        const spark = props.find((p: any) => p.card.uuid === "a2");
        // Both share base cardHeight (-84) but the bowed one adds another attachmentOffset (-13)
        expect(ember.style.marginTop).toBe("-84px");
        expect(spark.style.marginTop).toBe("-97px");
    });

    it("passes onMouseOver through unless disableMouseOver flips it off", () => {
        render(<CardAttachments { ...baseProps } disableMouseOver />);
        const firstCall = cardSpy.mock.calls[0][0];
        expect(firstCall.onMouseOver).toBeNull();
        expect(firstCall.onMouseOut).toBeNull();
    });

    it("propagates onClick + onMenuItemClick to each Card", () => {
        render(<CardAttachments { ...baseProps } />);
        const firstCall = cardSpy.mock.calls[0][0];
        expect(firstCall.onClick).toBe(baseProps.onClick);
        expect(firstCall.onMenuItemClick).toBe(baseProps.onMenuItemClick);
    });
});
