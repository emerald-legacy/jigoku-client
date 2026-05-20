import type { Card as CardType } from "../types/game";
import type { CounterData } from "./CardCounters";

export function buildCardCounters(card: CardType): Record<string, CounterData> {
    const counters: Record<string, CounterData | undefined> = {};

    // Prime encoding: a single integer carries three independent booleans.
    // HonorStatusCounter decodes via modulo (% 2 honored, % 3 dishonored, % 5 tainted).
    let statusFlag = 1;
    if(card.isHonored) {
        statusFlag *= 2;
    }
    if(card.isDishonored) {
        statusFlag *= 3;
    }
    if(card.isTainted) {
        statusFlag *= 5;
    }

    // Counters inherited from an attachment are rendered dimmed (CSS class `fade-out`).
    const inheritedFromAttachment = card.type === "attachment";

    counters["card-fate"] = card.fate ? { count: card.fate, fade: inheritedFromAttachment, shortName: "F" } : undefined;
    counters["card-status"] = statusFlag > 1 ? { count: statusFlag, fade: inheritedFromAttachment, shortName: "Hd" } : undefined;

    // Engine only emits TokenTypes.Honor; routed to HonorCounter via the "honor" key in CardCounters.
    if(card.tokens) {
        Object.entries(card.tokens).forEach(([key, token]: [string, number]) => {
            counters[key] = { count: token, fade: inheritedFromAttachment };
        });
    }

    if(card.attachments) {
        card.attachments.forEach((attachment: CardType) => {
            Object.assign(counters, buildCardCounters(attachment));
        });
    }

    const filtered: Record<string, CounterData> = {};
    Object.entries(counters).forEach(([key, counter]: [string, CounterData | undefined]) => {
        if(counter != null && !(typeof counter === "number" && counter < 0)) { // eslint-disable-line eqeqeq
            filtered[key] = counter;
        }
    });
    return filtered;
}
