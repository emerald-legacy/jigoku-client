import { configureStore } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import rootReducer from "./reducers";
import callAPIMiddleware from "./middleware/api-middleware";

export default function createStore(initialState?: any) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: initialState,
        middleware: ((getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false
            }).concat(callAPIMiddleware as Middleware)) as any,
        devTools: import.meta.env.DEV
    });

    return store;
}
