import { useEffect, useRef, useState } from "react";
import type { Card } from "../types/game";

const EXIT_DURATION_MS = 550;

export function useCardListWithExit(cards: Card[] | undefined): Card[] {
    const [leaving, setLeaving] = useState<Card[]>([]);
    const prevByUuid = useRef<Map<string, Card>>(new Map());
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        const current = cards || [];
        const currentUuids = new Set(current.map(c => c.uuid));

        const removed: Card[] = [];
        for(const [uuid, card] of prevByUuid.current) {
            if(!currentUuids.has(uuid) && !timers.current.has(uuid)) {
                removed.push({ ...card, leaving: true });
            }
        }

        if(removed.length > 0) {
            setLeaving(l => [...l.filter(c => !currentUuids.has(c.uuid)), ...removed]);
            for(const card of removed) {
                const handle = setTimeout(() => {
                    setLeaving(l => l.filter(c => c.uuid !== card.uuid));
                    timers.current.delete(card.uuid);
                }, EXIT_DURATION_MS);
                timers.current.set(card.uuid, handle);
            }
        } else {
            setLeaving(l => l.filter(c => !currentUuids.has(c.uuid)));
        }

        const next = new Map<string, Card>();
        for(const c of current) {
            next.set(c.uuid, c);
        }
        prevByUuid.current = next;
    }, [cards]);

    useEffect(() => () => {
        for(const handle of timers.current.values()) {
            clearTimeout(handle);
        }
        timers.current.clear();
    }, []);

    if(leaving.length === 0) {
        return cards || [];
    }
    return [...(cards || []), ...leaving];
}
