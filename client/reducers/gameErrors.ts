import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { GameErrorSummary, GameErrorRecord, GameErrorsState } from "../types/redux";
import { loadGameErrors, loadGameError, resolveGameError } from "../ReduxActions/gameErrors";
import { addLoadingMatchers } from "./loadingMatchers";

const gameErrorsSlice = createSlice({
    name: "gameErrors",
    initialState: { errors: [] } as GameErrorsState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadGameErrors.fulfilled, (state: GameErrorsState, action: PayloadAction<{ success: boolean; errors: GameErrorSummary[] }>) => {
                state.errors = action.payload.errors;
            })
            .addCase(loadGameError.fulfilled, (state: GameErrorsState, action: PayloadAction<{ success: boolean; error: GameErrorRecord }>) => {
                state.current = action.payload.error;
            })
            .addCase(resolveGameError.fulfilled, (state: GameErrorsState, action: PayloadAction<{ success: boolean; id: string }>) => {
                if(state.errors) {
                    state.errors = state.errors.filter((entry) => entry._id !== action.payload.id);
                }
                if(state.current && state.current._id === action.payload.id) {
                    state.current = undefined;
                }
            });
        addLoadingMatchers(builder, "gameErrors");
    }
});

export default gameErrorsSlice.reducer;
