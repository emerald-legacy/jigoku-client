import { useEffect, useRef, useState } from "react";
import type { Card } from "../types/game";

const EXIT_DURATION_MS = 550;

export function useCardListWithExit(cards: Card[] | undefined): Card[] {
    const [leaving, setLeaving] = useState<Map<string, Card>>(() => new Map());
    const prevOrder = useRef<Card[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const current = cards || [];

    useEffect(() => {
        const currentUuids = new Set(current.map(c => c.uuid));
        const next = new Map(leaving);
        let dirty = false;

        for(const uuid of Array.from(next.keys())) {
            if(currentUuids.has(uuid)) {
                next.delete(uuid);
                const t = timers.current.get(uuid);
                if(t) {
                    clearTimeout(t);
                    timers.current.delete(uuid);
                }
                dirty = true;
            }
        }

        for(const prevCard of prevOrder.current) {
            if(!currentUuids.has(prevCard.uuid) && !next.has(prevCard.uuid)) {
                const uuid = prevCard.uuid;
                next.set(uuid, { ...prevCard, leaving: true });
                const handle = setTimeout(() => {
                    setLeaving(prev => {
                        if(!prev.has(uuid)) {
                            return prev;
                        }
                        const m = new Map(prev);
                        m.delete(uuid);
                        return m;
                    });
                    timers.current.delete(uuid);
                }, EXIT_DURATION_MS);
                timers.current.set(uuid, handle);
                dirty = true;
            }
        }

        if(dirty) {
            setLeaving(next);
        }

        prevOrder.current = current;
    }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => () => {
        for(const handle of timers.current.values()) {
            clearTimeout(handle);
        }
        timers.current.clear();
    }, []);

    if(leaving.size === 0) {
        return current;
    }

    const currentByUuid = new Map(current.map(c => [c.uuid, c]));
    const result: Card[] = [];

    for(const prevCard of prevOrder.current) {
        const uuid = prevCard.uuid;
        if(leaving.has(uuid)) {
            result.push(leaving.get(uuid) as Card);
        } else if(currentByUuid.has(uuid)) {
            result.push(currentByUuid.get(uuid) as Card);
            currentByUuid.delete(uuid);
        }
    }

    for(const card of currentByUuid.values()) {
        result.push(card);
    }

    return result;
}
