

const BASE = ""; // set server base when ready

async function jsonFetch(url, opts = {}) {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  addTag: (payload) => jsonFetch("/tags", { method: "POST", body: JSON.stringify(payload) }),
  searchTags: (q) => jsonFetch(`/tags/search?q=${encodeURIComponent(q)}`),
  uploadVideo: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(BASE + "/upload", { method: "POST", body: fd }).then((r) => r.json());
  },
};
