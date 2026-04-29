import { GamesState, AnimationEvent } from "../types/redux";

function games(state: GamesState = {
    games: []
} as GamesState, action: any): GamesState {
    let retState: Partial<GamesState> = {};
    switch(action.type) {
        case "START_NEWGAME":
            return Object.assign({}, state, {
                newGame: true
            });
        case "CANCEL_NEWGAME":
            return Object.assign({}, state, {
                newGame: false
            });
        case "RECEIVE_GAMES":
            var ret = Object.assign({}, state, {
                games: action.games
            });

            if(state.currentGame && !state.currentGame.started && !action.games.find((game: any) => {
                return game.id === state.currentGame.id;
            })) {
                ret.currentGame = undefined;
                ret.newGame = false;
            }

            return ret;
        case "RECEIVE_NEWGAME":
            return Object.assign({}, state, {
                currentGame: action.game,
                newGame: false
            });
        case "RECEIVE_GAMESTATE": {
            // If server sends incremental messages, accumulate them
            if(action.currentGame && action.currentGame.newMessages && state.currentGame && state.currentGame.messages) {
                action.currentGame.messages = state.currentGame.messages.concat(action.currentGame.messages);
            }
            delete action.currentGame.newMessages;

            const incomingAnimations: AnimationEvent[] | undefined = action.currentGame.animations;
            delete action.currentGame.animations;

            retState = Object.assign({}, state, {
                currentGame: action.currentGame,
                pendingAnimations: incomingAnimations !== undefined
                    ? (state.pendingAnimations || []).concat(incomingAnimations)
                    : state.pendingAnimations
            });

            var currentState = (retState as GamesState).currentGame;
            if(!currentState) {
                retState.newGame = false;
                return retState as GamesState;
            }

            if(currentState && currentState.spectators.some((spectator: any) => {
                return spectator.name === action.username;
            })) {
                return retState as GamesState;
            }

            if(!currentState || !currentState.players[action.username] || currentState.players[action.username].left) {
                delete retState.currentGame;
                retState.newGame = false;
            }

            if(currentState) {
                delete retState.passwordGame;
                delete retState.passwordJoinType;
                delete retState.passwordError;
            }

            return retState as GamesState;
        }
        case "CLEAR_ANIMATION": {
            const pending = state.pendingAnimations || [];
            const filtered = pending.filter(a => {
                if("targetUuid" in a) {
                    return a.targetUuid !== action.id;
                }
                return a.playerName !== action.id;
            });
            return Object.assign({}, state, { pendingAnimations: filtered });
        }
        case "GAME_SOCKET_CLOSED":
            return Object.assign({}, state, {
                currentGame: undefined
            });
        case "RECEIVE_USERS":
            return Object.assign({}, state, {
                users: action.users
            });
        case "JOIN_PASSWORD_GAME":
            return Object.assign({}, state, {
                passwordGame: action.game,
                passwordJoinType: action.joinType
            });
        case "RECEIVE_PASSWORD_ERROR":
            return Object.assign({}, state, {
                passwordError: action.message
            });
        case "CANCEL_PASSWORD_JOIN":
            return Object.assign({}, state, {
                passwordGame: undefined,
                passwordError: undefined,
                passwordJoinType: undefined
            });
        case "CLEAR_GAMESTATE": {

            const { currentGame: _currentGame, ...stateWithoutGame } = state;
            retState = stateWithoutGame;
            retState.newGame = false;
            return retState as GamesState;
        }
        case "RECEIVE_GAME_STATS":
            return Object.assign({}, state, {
                gameStats: action.response.stats
            });
        case "HANDOFF_RECEIVED":
            return Object.assign({}, state, {
                gameId: action.details.gameId
            });
        default:
            return state;
    }
}

export default games;
