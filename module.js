const baseUrl = "https://hanime.tv";

// Helper: Ensures data is a clean String and turns slugs into readable titles
function toCleanString(val) {
    if (!val) return "";
    let str = String(val);
    // Convert 'slug-text' to 'Slug Text'
    if (str.includes('-') && !str.includes(' ')) {
        return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return str;
}

// 1. SEARCH: Fetches from Hanime's search API
async function searchResults(keyword) {
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": String(keyword),
                "tags": [], "tags_mode": "AND", "brands": [], "blacklist": [],
                "order_by": "views", "ordering": "desc", "page": 0
            })
        });

        const data = await response.json();
        const hits = JSON.parse(data.hits);

        return hits.map(item => ({
            title: toCleanString(item.name || item.slug),
            link: "https://hanime.tv/videos/hentai/" + String(item.slug),
            image: String(item.cover_url)
        }));
    } catch (e) {
        return [];
    }
}

// 2. DETAILS: Grabs description and tags
async function extractDetails(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch("https://hanime.tv/api/v8/video?id=" + slug);
        const data = await response.json();
        const v = data.hentai_video;
        
        return {
            description: String(v.description.replace(/<[^>]*>?/gm, '')),
            genres: v.hentai_tags.map(t => String(t.text)),
            status: String(v.released_at),
            rating: String(v.rating)
        };
    } catch (e) {
        return { description: "Details unavailable" };
    }
}

// 3. EPISODES: Maps the video link for the player
async function extractEpisodes(url) {
    try {
        const slug = url.split('/').pop();
        return [{
            name: "Play: " + toCleanString(slug),
            url: String(url)
        }];
    } catch (e) {
        return [];
    }
}

// 4. STREAM URL: Targets the HLS (.m3u8) format specifically
async function extractStreamUrl(url) {
    try {
        const slug = url.split('/').pop();
        const response = await fetch("https://hanime.tv/api/v8/video?id=" + slug);
        const data = await response.json();
        
        // Target Hanime's HLS manifest
        const servers = data.videos_manifest.servers;
        const streams = servers[0].streams;
        
        // Sort to get the highest resolution (usually 1080p or 720p)
        const bestStream = streams.sort((a, b) => parseInt(b.height) - parseInt(a.height))[0];
        
        return String(bestStream.url);
    } catch (e) {
        return "";
    }
}
