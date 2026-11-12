import type { Card } from "./types/game";

/** The game server sends the controller's name; replays recorded before that carry `{ name }`. */
export function controllerName(controller: Card["controller"]): string | undefined {
    return typeof controller === "string" ? controller : controller?.name;
}
