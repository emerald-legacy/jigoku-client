import "./tailwind.css";
// @ts-expect-error react-dom/client has no .d.ts in this layout
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import configureStore from "./configureStore";
import { login } from "./actions";
import Application from "./Application";
import ErrorBoundary from "./SiteComponents/ErrorBoundary";

const store = configureStore();

if(window.user) {
    store.dispatch(login({ user: window.user, token: window.authToken, isAdmin: window.user.admin }));
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
