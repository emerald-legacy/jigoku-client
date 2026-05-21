import { configureStore } from "@reduxjs/toolkit";
import type { RootState } from "./types/redux";
import rootReducer from "./reducers";

export default function createStore(initialState?: Partial<RootState>) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: initialState,
        devTools: import.meta.env.DEV
    });

    return store;
}
