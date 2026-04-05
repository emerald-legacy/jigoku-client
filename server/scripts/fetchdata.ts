/*eslint no-console:0 */
const fs = require("fs");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const db = require("../db.js");
const path = require("path");
const sharp = require("sharp");

const CardService = require("../services/CardService.js");

// Project root: works for both source (server/scripts/) and compiled (build/server/scripts/)
const projectRoot = path.resolve(__dirname, "..", "..", fs.existsSync(path.join(__dirname, "..", "..", "views")) ? "" : "..");

const args = process.argv.slice(2);
const env = args[0];
const forceDownload = args.includes("--force") || args.includes("-f");

// Parse --cycle flag: only download images for packs in this cycle (e.g. emerald-legacy)
const cycleIndex = args.indexOf("--cycle");
const cycleFilter = cycleIndex !== -1 ? args[cycleIndex + 1] : null;

// Parse --packs flag: comma-separated list of pack IDs to limit image downloads
const packsIndex = args.indexOf("--packs");
const packFilter = packsIndex !== -1 && args[packsIndex + 1]
    ? new Set(args[packsIndex + 1].split(","))
    : null;

if(env !== "live" && env !== "playtest") {
    console.error(
        "Must pass parameter with valid environment. The options are `live` or `playtest`"
    );
    console.error("Usage: node fetchdata.js <live|playtest> [--force] [--cycle cycle-id] [--packs pack1,pack2,...]");
    console.error("  --force, -f: Re-download existing images");
    console.error("  --cycle: Only download images for packs in this cycle (e.g. emerald-legacy)");
    console.error("  --packs: Only download images for these pack IDs (comma-separated)");
    process.exit(1);
}

if(forceDownload) {
    console.log("Force download enabled - will re-download existing images");
}

const apiUrl =
    env === "playtest"
        ? "https://beta-emeralddb.herokuapp.com/api/"
        : "https://www.emeralddb.org/api/";

async function apiRequest(apiPath) {
    const response = await fetch(apiUrl + apiPath);
    if(!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

const dbPath = process.env.DB_PATH || "mongodb://127.0.0.1:27017/jigoku";
let cardService;

async function downloadFile(url, destPath, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if(!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(destPath);
        // @ts-ignore - response.body is a Web ReadableStream
        const nodeStream = Readable.fromWeb(response.body);
        await pipeline(nodeStream, fileStream);
    } finally {
        clearTimeout(timeoutId);
    }
}

async function downloadWithRetry(url, dest, filename, maxRetries = 3) {
    const isPng = url.toLowerCase().endsWith(".png");
    const tempFilename = isPng ? filename.replace(".jpg", ".png") : filename;
    const tempPath = path.join(dest, tempFilename);
    const finalPath = path.join(dest, filename);

    for(let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await downloadFile(url, tempPath, 30000);

            // Convert PNG to JPG if needed
            if(isPng) {
                await sharp(tempPath)
                    .jpeg({ quality: 90 })
                    .toFile(finalPath);

                // Remove the temporary PNG file
                fs.unlinkSync(tempPath);

                return { success: true, converted: true };
            }

            return { success: true, converted: false };
        } catch(error) {
            // Clean up partial file on error
            if(fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch{ /* ignore cleanup errors */ }
            }

            if(attempt === maxRetries) {
                return { success: false, error: error.message };
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Parallel download with concurrency limit
async function downloadParallel(tasks, concurrency = 10) {
    const results = [];
    let index = 0;

    async function worker() {
        while(index < tasks.length) {
            const currentIndex = index++;
            const task = tasks[currentIndex];
            const result = await task();
            results[currentIndex] = result;
        }
    }

    const workers = Array(Math.min(concurrency, tasks.length))
        .fill(null)
        .map(() => worker());

    await Promise.all(workers);
    return results;
}

async function resolvePackFilter() {
    // Start with explicit --packs if provided
    let filter = packFilter ? new Set(packFilter) : null;

    // If --cycle is set, fetch packs from API and add matching pack IDs
    if(cycleFilter) {
        const packs = await apiRequest("packs");
        const cyclePacks = packs.filter(p => p.cycle_id === cycleFilter);
        if(cyclePacks.length === 0) {
            console.warn(`Warning: no packs found for cycle "${cycleFilter}"`);
        } else {
            if(!filter) {
                filter = new Set();
            }
            for(const pack of cyclePacks) {
                filter.add(pack.id);
            }
            console.log(`Cycle "${cycleFilter}" resolved to ${cyclePacks.length} packs: ${cyclePacks.map(p => p.id).join(", ")}`);
        }
    }

    if(filter) {
        console.log("Pack filter active - only downloading images for:", [...filter].join(", "));
    }

    return filter;
}

async function fetchCards(imagePackFilter) {
    try {
        const cards = await apiRequest("cards");
        await cardService.replaceCards(cards);
        console.info(cards.length + " cards fetched");

        const imageDir = path.join(
            projectRoot,
            "public",
            "img",
            "cards"
        );
        fs.mkdirSync(imageDir, { recursive: true });

        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        let converted = 0;
        const failedCards = [];
        const convertedCards = [];

        console.log("Starting image downloads (10 parallel)...");

        // Build list of download tasks for ALL versions of each card
        const downloadTasks = [];
        let skippedCount = 0;
        let totalVersions = 0;

        for(let i = 0; i < cards.length; i++) {
            const card = cards[i];

            if(!card.versions || card.versions.length === 0) {
                skippedCount++;
                continue;
            }

            // Download ALL versions of the card (or filtered versions if --packs is set)
            for(let versionIndex = 0; versionIndex < card.versions.length; versionIndex++) {
                const version = card.versions[versionIndex];
                totalVersions++;

                // Skip versions not in the pack filter
                if(imagePackFilter && !imagePackFilter.has(version.pack_id)) {
                    skippedCount++;
                    continue;
                }

                if(!version.image_url) {
                    skippedCount++;
                    continue;
                }

                const imageSrc = version.image_url;

                // Naming scheme: always {card.id}-{pack_id}.jpg
                const filename = card.id + "-" + version.pack_id + ".jpg";

                const imagePath = path.join(imageDir, filename);

                if(!forceDownload && fs.existsSync(imagePath)) {
                    skippedCount++;
                    continue;
                }

                // Create a download task
                downloadTasks.push(async () => {
                    const result = await downloadWithRetry(imageSrc, imageDir, filename);
                    return { card, version, result, url: imageSrc, filename };
                });
            }
        }

        skipped = skippedCount;
        console.log(`Skipping ${skipped} cards (already exist or no image)`);
        console.log(`Downloading ${downloadTasks.length} images...`);

        // Execute downloads in parallel
        const results = await downloadParallel(downloadTasks, 10);

        // Process results
        for(const { card, result, url, filename } of results) {
            if(result.success) {
                downloaded++;
                if(result.converted) {
                    converted++;
                    convertedCards.push({ id: card.id, name: card.name, filename: filename, url: url });
                }
                if(downloaded % 50 === 0) {
                    console.log(`Downloaded ${downloaded}/${downloadTasks.length} images...`);
                }
            } else {
                failed++;
                failedCards.push({ id: card.id, name: card.name, filename: filename, url: url, error: result.error });
            }
        }

        console.log("\n=== Download Summary ===");
        console.log(`Total cards: ${cards.length}`);
        console.log(`Total versions: ${totalVersions}`);
        console.log(`Downloaded: ${downloaded}`);
        console.log(`Converted PNG to JPG: ${converted}`);
        console.log(`Skipped (already exist or no image): ${skipped}`);
        console.log(`Failed: ${failed}`);

        if(convertedCards.length > 0) {
            console.log("\n=== Converted from PNG ===");
            convertedCards.forEach(c => {
                console.log(`${c.filename} - ${c.name}`);
            });
        }

        if(failedCards.length > 0) {
            console.log("\n=== Failed Downloads ===");
            failedCards.slice(0, 20).forEach(c => {
                console.log(`${c.filename} (${c.name}): ${c.error}`);
            });
            if(failedCards.length > 20) {
                console.log(`... and ${failedCards.length - 20} more`);
            }
        }

        // Write version file for cache busting
        const versionPath = path.join(imageDir, "version.json");
        const version = { timestamp: Date.now() };
        fs.writeFileSync(versionPath, JSON.stringify(version));
        console.log("Wrote image version file:", version.timestamp);

        return cards;
    } catch(error) {
        console.error("Unable to fetch cards:", error.message);
        console.error(error.stack);
    }
}

async function fetchPacks() {
    try {
        const packs = await apiRequest("packs");
        await cardService.replacePacks(packs);
        console.info(packs.length + " packs fetched");
    } catch(error) {
        console.error("Unable to fetch packs:", error.message);
    }
}

async function main() {
    await db.connect(dbPath);
    cardService = new CardService(db.getDb());

    const imagePackFilter = await resolvePackFilter();
    await Promise.all([fetchCards(imagePackFilter), fetchPacks()]);
    await db.close();
}

main().catch(err => {
    console.error("Fatal error:", err);
    db.close();
    process.exit(1);
});
