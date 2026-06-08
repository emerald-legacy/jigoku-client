import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() }
}));

import { InnerProfile } from "../../client/Profile";
import { toast } from "sonner";

const userFixture = {
    username: "u",
    email: "user@example.com",
    settings: { background: "none", cardSize: "normal" }
};

describe("<InnerProfile /> save flow", () => {
    beforeEach(() => {
        reduxDispatch.mockReset();
        saveProfileSpy.mockReset();
        (toast.error as ReturnType<typeof vi.fn>).mockReset();
        (toast.success as ReturnType<typeof vi.fn>).mockReset();
        reduxDispatch.mockReturnValue({ unwrap: () => Promise.resolve() });
    });

    it("renders the logged-out alert when no user is supplied", () => {
        render(<InnerProfile />);
        expect(screen.getByText(/must be logged in/i)).toBeInTheDocument();
    });

    it("blocks dispatch and surfaces an error toast when the email is invalid (regression: was reading stale `validation` closure)", () => {
        render(<InnerProfile user={ userFixture as any } />);
        const email = screen.getByLabelText("Email Address") as HTMLInputElement;
        fireEvent.change(email, { target: { value: "not-an-email" } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("error in one or more fields"), { id: "profile-save" });
    });

    it("blocks dispatch when the new password is shorter than 6 characters", () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.change(screen.getByLabelText("Current Password") as HTMLInputElement, { target: { value: "currentpw" } });
        fireEvent.change(screen.getByLabelText("New Password") as HTMLInputElement, { target: { value: "abc" } });
        fireEvent.change(screen.getByLabelText("New Password (again)") as HTMLInputElement, { target: { value: "abc" } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
    });

    it("blocks dispatch when the email changes but no current password is provided", () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.change(screen.getByLabelText("Email Address") as HTMLInputElement, { target: { value: "new@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect(saveProfileSpy).not.toHaveBeenCalled();
        expect(reduxDispatch).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("enter your current password"), { id: "profile-save" });
    });

    it("dispatches saveProfile once with the assembled payload on a valid submit and surfaces the success toast", async () => {
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
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
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Profile saved successfully"), { id: "profile-save" }));
    });

    it("surfaces the thunk rejection message in an error toast when saveProfile fails", async () => {
        reduxDispatch.mockReturnValue({ unwrap: () => Promise.reject(new Error("server kaboom")) });
        render(<InnerProfile user={ userFixture as any } />);
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("server kaboom", { id: "profile-save" }));
    });

    it("renders one picker tile per entry in the shared backgrounds data file (single source of truth across Profile and Application)", async () => {
        const { backgrounds } = await import("../../client/backgrounds");
        const { container } = render(<InnerProfile user={ userFixture as any } />);
        const tiles = container.querySelectorAll(".bg-grid .bg-swatch .bg-label");
        expect(tiles).toHaveLength(backgrounds.length);
        expect(Array.from(tiles).map(el => el.textContent)).toEqual(backgrounds.map(bg => bg.label));
    });

    it("selecting a picker tile sets background in the assembled saveProfile payload", () => {
        const { container } = render(<InnerProfile user={ userFixture as any } />);
        const cranetile = Array.from(container.querySelectorAll(".bg-swatch"))
            .find(el => el.querySelector(".bg-label")?.textContent === "Crane") as HTMLElement;
        fireEvent.click(cranetile);
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect(saveProfileSpy.mock.calls[0][0].payload.settings.background).toBe("CRANE");
    });
});
