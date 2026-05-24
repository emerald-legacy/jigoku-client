import "./tailwind.css";
// @ts-expect-error react-dom/client has no .d.ts in this layout
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import axios from "axios";
import configureStore from "./configureStore";
import { login } from "./actions";
import Application from "./Application";
import ErrorBoundary from "./SiteComponents/ErrorBoundary";
import bootstrap from "./bootstrap";

function reportClientError(payload: {
    errorMessage: string;
    errorStack?: string;
    kind: "window" | "unhandledRejection";
}) {
    axios.post("/api/admin/game-errors/client", {
        ...payload,
        url: window.location.href,
        userAgent: navigator.userAgent
    }).catch(() => {});
}

window.addEventListener("error", (event) => {
    reportClientError({
        errorMessage: event.message || "Unknown error",
        errorStack: event.error?.stack,
        kind: "window"
    });
});

window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason?.message || (typeof reason === "string" ? reason : "Unhandled rejection");
    reportClientError({
        errorMessage: message,
        errorStack: reason?.stack,
        kind: "unhandledRejection"
    });
});

const store = configureStore();

if(bootstrap.user) {
    store.dispatch(login({ user: bootstrap.user, token: bootstrap.token, isAdmin: bootstrap.user.admin }));
}

const container = document.getElementById("component");
const root = createRoot(container);

const render = () => {
    root.render(
        <Provider store={ store }>
            <BrowserRouter>
                <div className="body">
                    <Toaster
                        position="top-right"
                        duration={ 4000 }
                        richColors
                    />
                    <ErrorBoundary message={ "We're sorry, a critical error has occurred in the client and we're unable to show you anything. Please try refreshing your browser after filling out a report." }>
                        <Application />
                    </ErrorBoundary>
                </div>
            </BrowserRouter>
        </Provider>
    );
};

render();
