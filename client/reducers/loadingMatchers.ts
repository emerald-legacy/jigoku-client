import type { Action, ActionReducerMapBuilder } from "@reduxjs/toolkit";

interface LoadingState {
    loading?: boolean;
}

function actionTypeOf(action: Action): string {
    return typeof action.type === "string" ? action.type : "";
}

export function addLoadingMatchers<S extends LoadingState>(
    builder: ActionReducerMapBuilder<S>,
    slicePrefix: string
): void {
    builder
        .addMatcher(
            (action: Action) => {
                const type = actionTypeOf(action);
                return type.startsWith(`${slicePrefix}/`) && type.endsWith("/pending");
            },
            (state) => {
                state.loading = true;
            }
        )
        .addMatcher(
            (action: Action) => {
                const type = actionTypeOf(action);
                return type.startsWith(`${slicePrefix}/`) && (type.endsWith("/fulfilled") || type.endsWith("/rejected"));
            },
            (state) => {
                state.loading = false;
            }
        );
}
