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

// 1. SEARCH: Required function name for Sora
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
            title: toCleanString(item.name || item.slug || "Unknown"),
            link: "https://hanime.tv/videos/hentai/" + safeString(item.slug),
            image: safeString(item.cover_url, "https://hanime.tv/favicon.ico")
        }));

        // Returns PagedResults object required by Sora
        return {
            results: results,
            nextPage: results.length > 0 ? (page || 1) + 1 : null
        };
    } catch (e) {
        return { results: [], nextPage: null };
    }
}

// 2. INFO: Required function name for Sora (details)
async function info(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch(`https://hanime.tv/api/v8/video?id=${slug}`);
        const data = await response.json();
        const v = data.hentai_video || {};
        
        return {
            title: toCleanString(v.name || slug),
            image: v.poster_url || "",
            description: safeString(v.description).replace(/<[^>]*>?/gm, '') || "No description.",
            genres: (v.hentai_tags || []).map(t => safeString(t.text)),
            status: safeString(v.released_at, "N/A"),
            rating: safeString(v.rating, "0")
        };
    } catch (e) {
        return { description: "Error loading details." };
    }
}

// 3. MEDIA: Required function name for Sora (episodes list)
async function media(url) {
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

// 4. SOURCES: Required function name for Sora (stream link)
async function sources(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch(`https://hanime.tv/api/v8/video?id=${slug}`);
        const data = await response.json();
        
        const servers = data.videos_manifest?.servers || [];
        if (servers.length === 0) return [];
        
        const streams = servers[0].streams || [];
        
        // Map streams to 'file' and 'label' objects for Sora's quality picker
        return streams.map(s => ({
            file: safeString(s.url),
            label: safeString(s.height) + "p"
        })).sort((a, b) => parseInt(b.label) - parseInt(a.label));

    } catch (e) {
        return [];
    }
}
