import type express from "express";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Rejects writes another site makes in a user's name (CSRF). The session cookie is SameSite=Lax, which already keeps it
 * off cross-site writes; this also covers other subdomains (same site, so Lax lets them through) and login CSRF, which
 * needs no cookie. Browsers send Sec-Fetch-Site; older ones only Origin. A request with neither isn't from a browser page.
 */
export function rejectCrossSiteWrites(req: express.Request, res: express.Response, next: express.NextFunction) {
    if(!WRITE_METHODS.has(req.method)) {
        return next();
    }

    const fetchSite = req.get("sec-fetch-site");
    if(fetchSite) {
        return fetchSite === "same-origin" || fetchSite === "none" ? next() : reject(res);
    }

    const origin = req.get("origin");
    if(!origin) {
        return next();
    }

    let originHost: string;
    try {
        originHost = new URL(origin).host;
    } catch(_err) {
        return reject(res);
    }

    return originHost === req.get("host") ? next() : reject(res);
}

function reject(res: express.Response) {
    res.status(403).send({ success: false, message: "Cross-site request rejected" });
}
