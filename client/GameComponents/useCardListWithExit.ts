import { useEffect, useReducer, useRef } from "react";
import type { Card } from "../types/game";

const EXIT_DURATION_MS = 550;

export function useCardListWithExit(cards: Card[] | undefined): Card[] {
    const current = cards ?? [];
    const displayedRef = useRef<Card[]>(current);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const [, tick] = useReducer((n: number) => n + 1, 0);

    const liveByUuid = new Map(current.map(c => [c.uuid, c]));
    const next: Card[] = [];

    for(const item of displayedRef.current) {
        const live = liveByUuid.get(item.uuid);
        if(live) {
            next.push(live);
            liveByUuid.delete(item.uuid);
        } else if(item.leaving) {
            next.push(item);
        } else {
            next.push({ ...item, leaving: true });
        }
    }
    for(const arrival of liveByUuid.values()) {
        next.push(arrival);
    }

    useEffect(() => {
        const prevLeaving = new Set(displayedRef.current.filter(c => c.leaving).map(c => c.uuid));
        const nextLeaving = new Set(next.filter(c => c.leaving).map(c => c.uuid));
        displayedRef.current = next;

        for(const uuid of prevLeaving) {
            if(!nextLeaving.has(uuid)) {
                clearTimeout(timersRef.current.get(uuid));
                timersRef.current.delete(uuid);
            }
        }
        for(const uuid of nextLeaving) {
            if(timersRef.current.has(uuid)) {
                continue;
            }
            const timer = setTimeout(() => {
                displayedRef.current = displayedRef.current.filter(c => c.uuid !== uuid);
                timersRef.current.delete(uuid);
                tick();
            }, EXIT_DURATION_MS);
            timersRef.current.set(uuid, timer);
        }
    });

    useEffect(() => () => {
        for(const t of timersRef.current.values()) {
            clearTimeout(t);
        }
    }, []);

    return next;
}
