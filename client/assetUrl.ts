// Content-hashed static assets, bundled by Vite.
//
// Everything under client/assets/img/ (board backgrounds, dials, tokens, status
// stones, clan mons, cardbacks, promos, loose UI images) is emitted by Vite with a
// per-file content hash, so a changed asset busts its own cache automatically — no
// manual ?v= versioning. Card art is the ONE exception: it lives in public/img/cards/
// (runtime-populated volume, not seen by the build) and is still served raw with a
// ?v=<timestamp> suffix via cardImageUrl.ts.
//
// Paths are runtime-built strings (e.g. dials/<material>/<type>.webp), so the assets
// cannot be statically imported one by one — import.meta.glob eagerly maps every file
// to its hashed URL and asset() looks it up by its original relative path.

const urls = import.meta.glob("./assets/img/**/*.{webp,png,jpg,jpeg,gif,cur}", {
    eager: true,
    query: "?url",
    import: "default"
}) as Record<string, string>;

export function asset(path: string): string {
    return urls[`./assets/img/${path}`] ?? "";
}

// Promo card art, keyed by the "<cardId>-<packId>" filename stem. Promos live under
// client/assets/img/promos/<set>/<cardId>-<packId>.webp and are baked into the image.
// Empty until promo files are added — the glob IS the manifest.
const promoUrls: Record<string, string> = {};
for(const [key, url] of Object.entries(urls)) {
    const match = key.match(/^\.\/assets\/img\/promos\/[^/]+\/(.+)\.webp$/);
    if(match) {
        promoUrls[match[1]] = url;
    }
}

export function promoArt(stem: string): string | undefined {
    return promoUrls[stem];
}
