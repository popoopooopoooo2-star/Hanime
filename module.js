const baseUrl = "https://hanime.tv";

// 1. SEARCH: Finds videos using Hanime's search API
async function searchResults(keyword) {
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": keyword,
                "tags": [],
                "tags_mode": "AND",
                "brands": [],
                "blacklist": [],
                "order_by": "views",
                "ordering": "desc",
                "page": 0
            })
        });

        const data = await response.json();
        const hits = JSON.parse(data.hits);

        return hits.map(item => ({
            title: item.name,
            link: baseUrl + "/videos/hentai/" + item.slug,
            image: item.cover_url
        }));
    } catch (e) {
        console.log("Search Error: " + e);
        return [];
    }
}

// 2. DETAILS: Pulls the description and metadata
async function extractDetails(url) {
    try {
        const slug = url.split('/').pop();
        const apiUri = "https://hanime.tv/api/v8/video?id=" + slug;
        const response = await fetch(apiUri);
        const data = await response.json();
        
        const v = data.hentai_video;
        
        return {
            description: v.description.replace(/<[^>]*>?/gm, ''), // Removes HTML tags
            genres: v.hentai_tags.map(t => t.text),
            status: v.released_at,
            rating: v.rating,
            brand: v.brand
        };
    } catch (e) {
        console.log("Details Error: " + e);
        return {};
    }
}

// 3. EPISODES: Hanime usually treats one page as one episode
async function extractEpisodes(url) {
    try {
        const slug = url.split('/').pop();
        return [{
            name: "Play Video: " + slug.replace(/-/g, ' '),
            url: url
        }];
    } catch (e) {
        console.log("Episode Error: " + e);
        return [];
    }
}

// 4. STREAM: Gets the actual .m3u8 video file
async function extractStreamUrl(url) {
    try {
        const slug = url.split('/').pop();
        const apiUri = "https://hanime.tv/api/v8/video?id=" + slug;
        const response = await fetch(apiUri);
        const data = await response.json();
        
        // This picks the first available high-quality stream
        const streams = data.videos_manifest.servers[0].streams;
        // Sorts to find the highest resolution available
        const bestStream = streams.sort((a, b) => parseInt(b.height) - parseInt(a.height))[0];
        
        return bestStream.url;
    } catch (e) {
        console.log("Stream Error: " + e);
        return "";
    }
}
