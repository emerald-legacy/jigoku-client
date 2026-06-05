import axios from "axios";
import { useEffect, useState } from "react";

// Client-side cache of "is this username a patron?" so the board/lobby can render
// patron visuals for opponents and spectators without the in-game game-node carrying the flag.
const cache = new Map<string, boolean>();
const inFlight = new Map<string, Promise<boolean>>();

export function getCachedPatronStatus(username?: string | null): boolean {
    if(!username) {
        return false;
    }
    return cache.get(username) ?? false;
}

export function fetchPatronStatus(username?: string | null): Promise<boolean> {
    if(!username) {
        return Promise.resolve(false);
    }
    if(cache.has(username)) {
        return Promise.resolve(cache.get(username) as boolean);
    }
    const existing = inFlight.get(username);
    if(existing) {
        return existing;
    }
    const request = axios.get(`/api/user/${encodeURIComponent(username)}/patron`)
        .then(response => {
            const patron = !!response.data?.isPatron;
            cache.set(username, patron);
            return patron;
        })
        .catch(() => false)
        .finally(() => {
            inFlight.delete(username);
        });
    inFlight.set(username, request);
    return request;
}

export function usePatronStatus(username?: string | null): boolean {
    const [patron, setPatron] = useState<boolean>(() => getCachedPatronStatus(username));

    useEffect(() => {
        if(!username) {
            setPatron(false);
            return;
        }
        let active = true;
        fetchPatronStatus(username).then(result => {
            if(active) {
                setPatron(result);
            }
        });
        return () => {
            active = false;
        };
    }, [username]);

    return patron;
}

export function usePatronStatuses(usernames: Array<string | null | undefined>): Record<string, boolean> {
    const key = usernames.filter(Boolean).join(",");
    const [statuses, setStatuses] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let active = true;
        const names = key ? key.split(",") : [];
        Promise.all(names.map(name => fetchPatronStatus(name).then(patron => [name, patron] as const)))
            .then(entries => {
                if(active) {
                    setStatuses(Object.fromEntries(entries));
                }
            });
        return () => {
            active = false;
        };
    }, [key]);

    return statuses;
}
