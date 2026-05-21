import type { Card } from "./types/game";

export interface DragData {
    card: Card;
    source: string;
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
