const baseUrl = "https://hanime.tv";
// 1. SEARCH: Nuclear fast version
async function search(query, page) {
    const p = page || 1;
    try {
        const response = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // This tells the server the request is coming from their own site
                'Origin': 'https://hanime.tv',
                'Referer': 'https://hanime.tv/',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
            },
            body: JSON.stringify({
                "search_text": String(query),
                "tags": [],
                "order_by": "views",
                "ordering": "desc",
                "page": p - 1,
                "f": ["name", "slug", "cover_url"] 
            })
        });

        if (!response.ok) {
            console.log("Server error: " + response.status);
            return { results: [], nextPage: null };
        }

        const data = await response.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : (data.hits || []);

        const results = hits.slice(0, 12).map(item => ({
            title: String(item.name).replace(/-/g, ' '),
            link: "https://hanime.tv/videos/hentai/" + item.slug,
            image: item.cover_url
        }));

        return {
            results: results,
            nextPage: results.length >= 12 ? p + 1 : null
        };
    } catch (e) {
        console.log("Search failed: " + e.message);
        return { results: [], nextPage: null };
    }
}



// 2. INFO: Details Page
async function info(url) {
    try {
        const id = url.split('/').pop();
        const res = await fetch(`https://hanime.tv/api/v8/video?id=${id}`);
        const data = await res.json();
        const v = data.hentai_video;
        return {
            title: v.name,
            image: v.poster_url,
            description: v.description.replace(/<[^>]*>?/gm, ''),
            genres: v.hentai_tags.map(t => t.text)
        };
    } catch (e) { return { title: "Error loading" }; }
}

// 3. MEDIA: One-click Play
async function media(url) {
    return [{ name: "Play Video", url: url }];
}

// 4. SOURCES: Fast Stream Finder
async function sources(url) {
    try {
        const id = url.split('/').pop();
        const res = await fetch(`https://hanime.tv/api/v8/video?id=${id}`);
        const data = await res.json();
        const streams = data.videos_manifest.servers[0].streams;
        return streams.map(s => ({
            file: s.url,
            label: s.height + "p"
        })).filter(s => s.file !== "").sort((a, b) => parseInt(b.label) - parseInt(a.label));
    } catch (e) { return []; }
}
