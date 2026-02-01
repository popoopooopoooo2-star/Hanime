const baseUrl = "https://hanime.tv";

// Keep your helpers
function safeString(val, fallback = "") { return val ? String(val) : fallback; }
function toCleanString(val) { /* your existing logic */ }

// 1. SEARCH - Renamed to 'search' and added 'page' parameter
async function search(query, page) {
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": safeString(query),
                "tags": [], "tags_mode": "AND", "brands": [], "blacklist": [],
                "order_by": "views", "ordering": "desc", 
                "page": (page || 1) - 1 // Hanime is 0-indexed
            })
        });

        if (!response.ok) return { results: [], nextPage: null };

        const data = await response.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : data.hits;

        if (!Array.isArray(hits)) return { results: [], nextPage: null };

        const results = hits.map(item => ({
            title: toCleanString(item.name || item.slug),
            link: "https://hanime.tv/videos/hentai/" + safeString(item.slug),
            image: safeString(item.cover_url)
        }));

        // Return the PagedResults object Sora expects
        return {
            results: results,
            nextPage: results.length > 0 ? (page || 1) + 1 : null
        };
    } catch (e) {
        return { results: [], nextPage: null };
    }
}

// 2. INFO - Renamed from extractDetails
async function info(url) {
    // ... your existing details logic ...
}

// 3. MEDIA - Renamed from extractEpisodes
async function media(url) {
    // ... your existing episodes logic ...
}

// 4. SOURCES - Renamed from extractStreamUrl
async function sources(url) {
    // ... your existing stream logic ...
}
