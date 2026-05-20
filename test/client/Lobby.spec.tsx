import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ ui }</MemoryRouter>);
}

const dispatchSpy = vi.fn();
const loadServerVersionSpy = vi.fn(() => ({ __thunk: "loadServerVersion" }));
const useSelectorMock = vi.fn();

vi.mock("../../client/hooks", () => ({
    useAppDispatch: () => dispatchSpy,
    useAppSelector: (selector: any) => useSelectorMock(selector)
}));

vi.mock("../../client/ReduxActions/serverVersion", () => ({
    loadServerVersion: () => loadServerVersionSpy()
}));

import { InnerLobby } from "../../client/Lobby";

const baseProps = {
    loadNews: vi.fn(),
    news: [],
    users: []
};

describe("<InnerLobby />", () => {
    beforeEach(() => {
        dispatchSpy.mockReset();
        loadServerVersionSpy.mockReset();
        loadServerVersionSpy.mockReturnValue({ __thunk: "loadServerVersion" });
        useSelectorMock.mockReset();
        useSelectorMock.mockImplementation((selector: any) => selector({ serverVersion: { nodes: [] } }));
        (baseProps.loadNews as any).mockReset();
    });

    it("dispatches loadServerVersion exactly once on mount (replaces the legacy fetch /api/server-version that bypassed the axios interceptor)", () => {
        renderWithRouter(<InnerLobby { ...baseProps } />);
        expect(loadServerVersionSpy).toHaveBeenCalledOnce();
        expect(dispatchSpy).toHaveBeenCalledWith({ __thunk: "loadServerVersion" });
    });

    it("dispatches loadNews on mount with the configured limit", () => {
        renderWithRouter(<InnerLobby { ...baseProps } />);
        expect(baseProps.loadNews).toHaveBeenCalledExactlyOnceWith({ limit: 3 });
    });

    it("renders server-version node entries returned from the store selector", () => {
        useSelectorMock.mockImplementation((selector: any) => selector({
            serverVersion: { nodes: [{ name: "lobby", version: "1.2.3" }, { name: "node-1", version: "4.5.6" }] }
        }));
        renderWithRouter(<InnerLobby { ...baseProps } />);
        expect(screen.getByText(/lobby: 1\.2\.3/)).toBeInTheDocument();
        expect(screen.getByText(/node-1: 4\.5\.6/)).toBeInTheDocument();
    });

    it("renders the client build version without any node suffix when the store has no nodes", () => {
        const { container } = renderWithRouter(<InnerLobby { ...baseProps } />);
        const versionSpan = container.querySelector(".lobby-version");
        expect(versionSpan?.textContent).toMatch(/^Client:\s*\S+$/);
    });
});
