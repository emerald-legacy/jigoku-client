import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers";

export default function createStore(initialState?: any) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: initialState,
        devTools: import.meta.env.DEV
    });

    return store;
}
