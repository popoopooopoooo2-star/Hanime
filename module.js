const baseUrl = "https://hanime.tv";

/** * PROXY HELPER
 * Routes requests through corsproxy.io to bypass network blocks.
 */
function proxyUrl(url) {
    return "https://corsproxy.io/?" + encodeURIComponent(url);
}

function toCleanString(val) {
    let str = val ? String(val) : "";
    return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/** * 1. SEARCH - Bypasses blocks using Proxy
 */
async function search(query, page) {
    const p = page || 1;
    const apiUrl = "https://search.htv-services.com/";

    try {
        const response = await fetch(proxyUrl(apiUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": String(query),
                "tags": [],
                "order_by": "views",
                "ordering": "desc",
                "page": p - 1,
                "f": ["name", "slug", "cover_url"] 
            })
        });

        const data = await response.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : (data.hits || []);

        const results = hits.map(item => ({
            title: toCleanString(item.name || item.slug),
            link: "https://hanime.tv/videos/hentai/" + item.slug,
            image: item.cover_url
        }));

        return {
            results: results,
            nextPage: results.length >= 20 ? p + 1 : null
        };
    } catch (e) {
        return { results: [], nextPage: null };
    }
}

/** * 2. INFO - Fetches details through Proxy
 */
async function info(url) {
    try {
        const slug = url.split('/').pop();
        const res = await fetch(proxyUrl(`https://hanime.tv/api/v8/video?id=${slug}`));
        const data = await res.json();
        const v = data.hentai_video || {};
        
        return {
            title: v.name,
            image: v.poster_url,
            description: (v.description || "").replace(/<[^>]*>?/gm, ''),
            genres: (v.hentai_tags || []).map(t => t.text),
            status: v.released_at,
            rating: v.rating
        };
    } catch (e) {
        return { title: "Error", description: "Failed to load via Proxy." };
    }
}

/** * 3. MEDIA
 */
async function media(url) {
    return [{
        name: "Watch Video",
        url: url
    }];
}

/** * 4. SOURCES - Gets streams through Proxy
 */
async function sources(url) {
    try {
        const slug = url.split('/').pop();
        const res = await fetch(proxyUrl(`https://hanime.tv/api/v8/video?id=${slug}`));
        const data = await res.json();
        
        const servers = data.videos_manifest?.servers || [];
        if (servers.length === 0) return [];
        
        const streams = servers[0].streams || [];
        
        return streams
            .filter(s => s.url !== "")
            .map(s => ({
                file: s.url,
                label: s.height + "p"
            }))
            .sort((a, b) => parseInt(b.label) - parseInt(a.label));
    } catch (e) {
        return [];
    }
}

/** * 5. DISCOVER - Home screen through Proxy
 */
async function discover() {
    try {
        const res = await fetch(proxyUrl("https://hanime.tv/api/v8/browse-hentai-videos?category=trending&page=0&ordering=desc&order_by=views"));
        const data = await res.json();
        const videos = data.hentai_videos || [];

        return videos.slice(0, 15).map(v => ({
            title: toCleanString(v.name),
            link: "https://hanime.tv/videos/hentai/" + v.slug,
            image: v.cover_url
        }));
    } catch (e) {
        return [];
    }
}
