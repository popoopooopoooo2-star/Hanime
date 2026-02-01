const baseUrl = "https://hanime.tv";

// Safety Helper: Ensures we never pass a null value to the app
function safeString(val, fallback = "") {
    return val ? String(val) : fallback;
}

// Helper: Converts slugs to clean titles
function toCleanString(val) {
    let str = safeString(val);
    if (str.includes('-') && !str.includes(' ')) {
        return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return str;
}

// 1. SEARCH: Rebuilt with crash protection
async function searchResults(keyword) {
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": safeString(keyword),
                "tags": [], "tags_mode": "AND", "brands": [], "blacklist": [],
                "order_by": "views", "ordering": "desc", "page": 0
            })
        });

        if (!response.ok) return [];

        const data = await response.json();
        // Safety check: Ensure hits exists and is a valid string/array
        const hitsRaw = data.hits || "[]";
        const hits = typeof hitsRaw === 'string' ? JSON.parse(hitsRaw) : hitsRaw;

        if (!Array.isArray(hits)) return [];

        return hits.map(item => ({
            // If title is missing, it falls back to a clean version of the slug
            title: toCleanString(item.name || item.slug || "Unknown Video"),
            link: "https://hanime.tv/videos/hentai/" + safeString(item.slug),
            image: safeString(item.cover_url, "https://hanime.tv/favicon.ico")
        }));
    } catch (e) {
        console.error("Search Crash Prevented: " + e);
        return []; // Return empty list instead of crashing
    }
}

// 2. DETAILS
async function extractDetails(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch("https://hanime.tv/api/v8/video?id=" + slug);
        const data = await response.json();
        const v = data.hentai_video || {};
        
        return {
            description: safeString(v.description).replace(/<[^>]*>?/gm, '') || "No description.",
            genres: (v.hentai_tags || []).map(t => safeString(t.text)),
            status: safeString(v.released_at, "N/A"),
            rating: safeString(v.rating, "0")
        };
    } catch (e) {
        return { description: "Error loading details." };
    }
}

// 3. EPISODES
async function extractEpisodes(url) {
    try {
        const slug = url.split('/').pop();
        return [{
            name: "Play: " + toCleanString(slug),
            url: safeString(url)
        }];
    } catch (e) {
        return [];
    }
}

// 4. STREAM URL
async function extractStreamUrl(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch("https://hanime.tv/api/v8/video?id=" + slug);
        const data = await response.json();
        
        const servers = data.videos_manifest?.servers || [];
        if (servers.length === 0) return "";
        
        const streams = servers[0].streams || [];
        if (streams.length === 0) return "";
        
        // Pick highest resolution
        const bestStream = streams.sort((a, b) => parseInt(b.height || 0) - parseInt(a.height || 0))[0];
        
        return safeString(bestStream.url);
    } catch (e) {
        return "";
    }
}
