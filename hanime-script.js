// =========================
// Hanime Module for iOS App
// =========================

// -------------------------
// Utility: Safe JSON Parse
// -------------------------
function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("JSON Parse Error:", e);
    return null;
  }
}

// -------------------------
// SEARCH
// -------------------------
// Uses POST to: https://search.hanime.tv/
async function search(query) {
  const url = "https://search.hanime.tv/";

  const body = JSON.stringify({
    search_text: query,
    tags: [],
    tags_mode: "AND",
    brands: [],
    blacklist: [],
    order_by: "views",
    ordering: "desc",
    page: 0
  });

  const headers = {
    "Content-Type": "application/json"
  };

  console.log("Hanime search →", query);

  const raw = await fetch(url, headers, body);
  const data = safeJSON(raw);

  if (!data || !data.hits) return [];

  return data.hits.map((item) => ({
    id: item.slug,
    title: item.name,
    poster: item.poster_url,
    description: item.description
  }));
}

// -------------------------
// INFO
// -------------------------
// GET https://hanime.tv/api/v8/video?id=SLUG
async function getInfo(id) {
  const url = `https://hanime.tv/api/v8/video?id=${id}`;

  console.log("Hanime getInfo →", id);

  const raw = await fetch(url);
  const data = safeJSON(raw);

  if (!data || !data.hentai_video) return null;

  const hv = data.hentai_video;

  return {
    title: hv.name,
    description: hv.description,
    poster: hv.poster_url,
    episodes: [
      {
        id: hv.slug,
        title: "Episode 1",
        number: 1
      }
    ]
  };
}

// -------------------------
// SOURCES (Video URLs)
// -------------------------
async function getSources(id) {
  const url = `https://hanime.tv/api/v8/video?id=${id}`;

  console.log("Hanime getSources →", id);

  const raw = await fetch(url);
  const data = safeJSON(raw);

  if (!data || !data.hentai_video) return [];

  const manifest = data.hentai_video.videos_manifest;
  const servers = manifest.servers;

  let playlist = null;

  for (const server of servers) {
    for (const stream of server.streams) {
      if (stream.format === "hls") {
        playlist = stream.url;
        break;
      }
    }
    if (playlist) break;
  }

  if (!playlist) {
    console.log("No HLS stream found.");
    return [];
  }

  return [
    {
      url: playlist,
      quality: "720p",
      format: "hls"
    }
  ];
}

// Exporting for the host app
module.exports = {
  search,
  getInfo,
  getSources
};
