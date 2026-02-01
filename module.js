const baseUrl = "https://hanime.tv";
// 1. SEARCH: Nuclear fast version
async function search(query, page) {
    try {
        const res = await fetch("https://search.htv-services.com/", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' 
            },
            body: JSON.stringify({
                "search_text": query,
                "tags": [],
                "order_by": "views",
                "ordering": "desc",
                "page": (page || 1) - 1,
                "f": ["name", "slug", "cover_url"]
            })
        });
        const data = await res.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : data.hits;

        return {
            results: hits.slice(0, 10).map(i => ({
                title: i.name.replace(/-/g, ' '),
                link: "https://hanime.tv/videos/hentai/" + i.slug,
                image: i.cover_url
            })),
            nextPage: (page || 1) + 1
        };
    } catch (e) { return { results: [], nextPage: null }; }
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
