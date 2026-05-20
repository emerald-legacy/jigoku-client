import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const reduxDispatch = vi.fn();
const saveProfileSpy = vi.fn();

vi.mock("../../client/hooks", () => ({
    useAppDispatch: () => reduxDispatch
}));

vi.mock("../../client/ReduxActions/user", () => ({
    saveProfile: (payload: any) => {
        saveProfileSpy(payload);
        return { __thunk: true, payload };
    }
}));

import { InnerProfile } from "../../client/Profile";

const userFixture = {
    username: "u",
    email: "user@example.com",
    settings: { background: "none", cardSize: "normal" }
};

describe("<InnerProfile /> save flow", () => {
    beforeEach(() => {
        reduxDispatch.mockReset();
        saveProfileSpy.mockReset();
        reduxDispatch.mockReturnValue({ unwrap: () => Promise.resolve() });
    });

    it("renders the logged-out alert when no user is supplied", () => {
        render(<InnerProfile />);
        expect(screen.getByText(/must be logged in/i)).toBeInTheDocument();
    });

    it("blocks dispatch and surfaces an inline error when the email is invalid (regression: was reading stale `validation` closure)", async () => {
        render(<InnerProfile user={ userFixture as any } />);
        const email = screen.getByLabelText("Email Address") as HTMLInputElement;
        fireEvent.change(email, { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
        expect(await screen.findByText(/error in one or more fields/i)).toBeInTheDocument();
    });

    it("blocks dispatch when the new password is shorter than 6 characters", () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.change(screen.getByLabelText("Current Password") as HTMLInputElement, { target: { value: "currentpw" } });
        fireEvent.change(screen.getByLabelText("New Password") as HTMLInputElement, { target: { value: "abc" } });
        fireEvent.change(screen.getByLabelText("New Password (again)") as HTMLInputElement, { target: { value: "abc" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
    });

    it("blocks dispatch when the email changes but no current password is provided", () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.change(screen.getByLabelText("Email Address") as HTMLInputElement, { target: { value: "new@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
        expect(screen.getByText(/enter your current password/i)).toBeInTheDocument();
    });

    it("dispatches saveProfile once with the assembled payload on a valid submit and surfaces the success banner", async () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(saveProfileSpy).toHaveBeenCalledOnce();
        const callArg = saveProfileSpy.mock.calls[0][0];
        expect(callArg.user).toBe(userFixture);
        expect(callArg.payload).toMatchObject({
            email: "user@example.com",
            password: "",
            currentPassword: "",
            settings: { background: "none", cardSize: "normal", disableGravatar: false, windowTimer: 0 }
        });
        expect(reduxDispatch).toHaveBeenCalledOnce();
        expect(reduxDispatch.mock.calls[0][0]).toEqual({ __thunk: true, payload: callArg });
        expect(await screen.findByText(/Profile saved successfully/)).toBeInTheDocument();
    });

    it("surfaces the thunk rejection message when saveProfile fails", async () => {
        reduxDispatch.mockReturnValue({ unwrap: () => Promise.reject(new Error("server kaboom")) });
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("server kaboom")).toBeInTheDocument();
    });
});
