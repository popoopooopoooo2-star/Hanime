const baseUrl = "https://hanime.tv";
const pxy = (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`;

/** 1. SEARCH - Finds videos based on your query */
async function search(query, page) {
    const p = page || 1;
    try {
        const res = await fetch(pxy("https://search.htv-services.com/"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "search_text": String(query),
                "page": p - 1,
                "f": ["name", "slug", "cover_url"]
            })
        });
        const data = await res.json();
        const hits = typeof data.hits === 'string' ? JSON.parse(data.hits) : (data.hits || []);
        return {
            results: hits.map(i => ({
                title: i.name.replace(/-/g, ' '),
                link: `${baseUrl}/videos/hentai/${i.slug}`,
                image: i.cover_url
            })),
            nextPage: hits.length >= 10 ? p + 1 : null
        };
    } catch (e) { return { results: [], nextPage: null }; }
}

/** 2. DISCOVER - Controls the "Home" or "Trending" screen */
async function discover() {
    try {
        const res = await fetch(pxy("https://hanime.tv/api/v8/browse-hentai-videos?category=trending&page=0&ordering=desc&order_by=views"));
        const data = await res.json();
        const videos = data.hentai_videos || [];
        return videos.slice(0, 15).map(v => ({
            title: v.name,
            link: `${baseUrl}/videos/hentai/${v.slug}`,
            image: v.cover_url
        }));
    } catch (e) { return []; }
}

/** 3. INFO - Gets the description and tags when you click a video */
async function info(url) {
    try {
        const id = url.split('/').pop();
        const res = await fetch(pxy(`https://hanime.tv/api/v8/video?id=${id}`));
        const { hentai_video: v } = await res.json();
        return {
            title: v.name,
            image: v.poster_url,
            description: v.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...",
            genres: v.hentai_tags.map(t => t.text)
        };
    } catch (e) { return { title: "Error" }; }
}

/** 4. MEDIA - Tells Sora there is a video file to play */
async function media(url) {
    return [{ name: "High Quality Stream", url: url }];
}

/** 5. SOURCES - Finds the actual .m3u8 or .mp4 links */
async function sources(url) {
    try {
        const id = url.split('/').pop();
        const res = await fetch(pxy(`https://hanime.tv/api/v8/video?id=${id}`));
        const data = await res.json();
        const streams = data.videos_manifest.servers[0].streams;
        return streams
            .filter(s => s.url !== "")
            .map(s => ({ file: s.url, label: s.height + "p" }))
            .sort((a, b) => parseInt(b.label) - parseInt(a.label));
    } catch (e) { return []; }
}
