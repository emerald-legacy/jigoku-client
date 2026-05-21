import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { GamesState, AnimationEvent } from "../types/redux";
import { loadGameStats } from "../ReduxActions/gamestats";
import { gameSocketClosed } from "./socket";

const gamesSlice = createSlice({
    name: "games",
    initialState: { games: [] } as GamesState,
    reducers: {
        startNewGame(state) {
            state.newGame = true;
        },
        cancelNewGame(state) {
            state.newGame = false;
        },
        receiveGames(state, action: PayloadAction<any[]>) {
            state.games = action.payload;
            if(state.currentGame && !state.currentGame.started &&
                !action.payload.find((g: any) => g.id === state.currentGame.id)) {
                state.currentGame = undefined;
                state.newGame = false;
            }
        },
        receiveNewGame(state, action: PayloadAction<any>) {
            state.currentGame = action.payload;
            state.newGame = false;
        },
        receiveGameState: {
            reducer(state, action: PayloadAction<{ currentGame: any; username: string }>) {
                const { username } = action.payload;
                const { newMessages, animations, ...gameData } = action.payload.currentGame;

                if(newMessages && state.currentGame?.messages) {
                    gameData.messages = [...state.currentGame.messages, ...gameData.messages];
                }

                state.pendingAnimations = animations !== undefined
                    ? [...(state.pendingAnimations || []), ...animations]
                    : state.pendingAnimations;

                state.currentGame = gameData;

                if(!state.currentGame) {
                    state.newGame = false;
                    return;
                }

                if(state.currentGame.spectators.some((s: any) => s.name === username)) {
                    return;
                }

                if(!state.currentGame.players[username] || state.currentGame.players[username].left) {
                    state.currentGame = undefined;
                    state.newGame = false;
                }

                state.passwordGame = undefined;
                state.passwordJoinType = undefined;
                state.passwordError = undefined;
            },
            prepare(currentGame: any, username: string) {
                return { payload: { currentGame, username } };
            }
        },
        clearAnimation(state, action: PayloadAction<string>) {
            const pending = state.pendingAnimations || [];
            state.pendingAnimations = pending.filter((a: AnimationEvent) => {
                if("targetUuid" in a) {
                    return a.targetUuid !== action.payload;
                }
                return a.playerName !== action.payload;
            });
        },
        receiveUsers(state, action: PayloadAction<any[]>) {
            state.users = action.payload;
        },
        joinPasswordGame: {
            reducer(state, action: PayloadAction<{ game: any; joinType: string }>) {
                state.passwordGame = action.payload.game;
                state.passwordJoinType = action.payload.joinType;
            },
            prepare(game: any, joinType: string) {
                return { payload: { game, joinType } };
            }
        },
        receivePasswordError(state, action: PayloadAction<string>) {
            state.passwordError = action.payload;
        },
        cancelPasswordJoin(state) {
            state.passwordGame = undefined;
            state.passwordError = undefined;
            state.passwordJoinType = undefined;
        },
        clearGameState(state) {
            state.currentGame = undefined;
            state.newGame = false;
        },
        onGameHandoffReceived(state, action: PayloadAction<any>) {
            state.gameId = action.payload.gameId;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadGameStats.fulfilled, (state: GamesState, action: PayloadAction<any>) => {
                state.gameStats = action.payload.stats;
            })
            .addCase(gameSocketClosed, (state: GamesState) => {
                state.currentGame = undefined;
            });
    }
});

export const {
    startNewGame, cancelNewGame, receiveGames, receiveNewGame, receiveGameState,
    clearAnimation, receiveUsers, joinPasswordGame, receivePasswordError,
    cancelPasswordJoin, clearGameState, onGameHandoffReceived
} = gamesSlice.actions;
export default gamesSlice.reducer;
