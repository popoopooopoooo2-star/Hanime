const baseUrl = "https://hanime.tv";

/** * SAFETY HELPERS 
 */
function safeString(val, fallback = "") {
    return val ? String(val) : fallback;
}

function toCleanString(val) {
    let str = safeString(val);
    if (str.includes('-') && !str.includes(' ')) {
        return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return str;
}

/** * 1. SEARCH - Optimized for Speed 
 * Required Name: "search"
 */
async function search(query, page) {
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' 
            },
            body: JSON.stringify({
                "search_text": safeString(query),
                "tags": [],
                "order_by": "views",
                "ordering": "desc",
                "page": (page || 1) - 1,
                // SPEED HACK: Only request the data Sora actually displays
                "f": ["name", "slug", "cover_url"] 
            })
        });

        if (!response.ok) return { results: [], nextPage: null };

        const data = await response.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : (data.hits || []);

        // Limit results per page to make the UI pop up instantly
        const results = hits.slice(0, 15).map(item => ({
            title: toCleanString(item.name || item.slug),
            link: "https://hanime.tv/videos/hentai/" + safeString(item.slug),
            image: safeString(item.cover_url, "https://hanime.tv/favicon.ico")
        }));

        return {
            results: results,
            nextPage: results.length > 0 ? (page || 1) + 1 : null
        };
    } catch (e) {
        return { results: [], nextPage: null };
    }
}

/** * 2. INFO - Required Name: "info"
 */
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
        return { title: "Error", description: "Could not load video details." };
    }
}

/** * 3. MEDIA - Required Name: "media"
 */
async function media(url) {
    try {
        const slug = url.split('/').pop();
        return [{
            name: "Watch " + toCleanString(slug),
            url: safeString(url)
        }];
    } catch (e) {
        return [];
    }
}

/** * 4. SOURCES - Required Name: "sources"
 */
async function sources(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch(`https://hanime.tv/api/v8/video?id=${slug}`);
        const data = await response.json();
        
        const servers = data.videos_manifest?.servers || [];
        if (servers.length === 0) return [];
        
        const streams = servers[0].streams || [];
        
        // Formats as an array of quality objects for the picker
        return streams
            .filter(s => s.url !== "")
            .map(s => ({
                file: safeString(s.url),
                label: safeString(s.height) + "p"
            }))
            .sort((a, b) => parseInt(b.label) - parseInt(a.label));

    } catch (e) {
        return [];
    }
}

/** * 5. DISCOVER - Populates the App Home Screen
 */
async function discover() {
    try {
        const response = await fetch("https://hanime.tv/api/v8/browse-hentai-videos?category=trending&page=0&ordering=desc&order_by=views");
        const data = await response.json();
        const videos = data.hentai_videos || [];

        return videos.slice(0, 20).map(v => ({
            title: toCleanString(v.name),
            link: "https://hanime.tv/videos/hentai/" + v.slug,
            image: v.cover_url
        }));
    } catch (e) {
        return [];
    }
}
