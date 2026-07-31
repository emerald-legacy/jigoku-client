import type { Card } from "./types/game";

export interface DragData {
    card: Card;
    source: string;
}

export function rejectionMessage(error: unknown, fallback: string): string {
    if(error instanceof Error) {
        return error.message || fallback;
    }
    if(typeof error === "string") {
        return error || fallback;
    }
    if(error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;
        if(typeof message === "string" && message !== "") {
            return message;
        }
    }
    return fallback;
}

export function tryParseJSON(jsonString: string): DragData | false {
    try {
        var retObject = JSON.parse(jsonString);

        if(retObject && typeof retObject === "object") {
            return retObject as DragData;
        }
    } catch(_e) {
        return false;
    }
    return false;
}
