export function receiveGames(games: any[]) {
    return {
        type: "RECEIVE_GAMES" as const,
        games: games
    };
}

export function startNewGame() {
    return {
        type: "START_NEWGAME" as const
    };
}

export function cancelNewGame() {
    return {
        type: "CANCEL_NEWGAME" as const
    };
}

export function receiveGameState(game: any, username: string) {
    return {
        type: "RECEIVE_GAMESTATE" as const,
        currentGame: game,
        username: username
    };
}

export function clearGameState() {
    return {
        type: "CLEAR_GAMESTATE" as const
    };
}

export function joinPasswordGame(game: any, type: string) {
    return {
        type: "JOIN_PASSWORD_GAME" as const,
        game: game,
        joinType: type
    };
}

export function receivePasswordError(message: string) {
    return {
        type: "RECEIVE_PASSWORD_ERROR" as const,
        message: message
    };
}

export function cancelPasswordJoin() {
    return {
        type: "CANCEL_PASSWORD_JOIN" as const
    };
}

export function onGameHandoffReceived(details: any) {
    return {
        type: "HANDOFF_RECEIVED" as const,
        details: details
    };
}

export function clearAnimation(id: string) {
    return {
        type: "CLEAR_ANIMATION" as const,
        id: id
    };
}
