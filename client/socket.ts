import type { Socket } from "socket.io-client";

export type GameSocket = Socket & { gameClosing?: boolean };

let lobbySocket: Socket | null = null;
let gameSocket: GameSocket | null = null;

export function setLobbySocket(socket: Socket | null) {
    lobbySocket = socket;
}

export function getLobbySocket(): Socket | null {
    return lobbySocket;
}

export function setGameSocket(socket: GameSocket | null) {
    gameSocket = socket;
}

export function getGameSocket(): GameSocket | null {
    return gameSocket;
}
