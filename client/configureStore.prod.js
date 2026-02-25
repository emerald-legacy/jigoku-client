import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import callAPIMiddleware from './middleware/api-middleware.js';

export default function createStore(initialState) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: initialState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false, // Disable for socket.io objects
                immutableCheck: false // Disable for performance with large game state
            }).concat(callAPIMiddleware),
        devTools: false
    });

    return store;
}
