// src/LibraryTest.jsx
import React, { useEffect, useState } from "react";
import { fetchVideos, addVideo } from "./components/supabaseHelpers";

export default function LibraryTest() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      console.error("Error loading videos:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // This will insert a fake mediaItem into Supabase so you can test the flow.
  async function handleInsertTest() {
    setInserting(true);
    setError(null);

    // sample "mediaItem" — fields expected by addVideo()
    const fakeMediaItem = {
      id: `local-test-${Date.now()}`,               // unique id
      filename: `test-${Date.now()}.mp4`,
      baseUrl: "https://placekitten.com/800/450",   // placeholder image url works for thumbnail
      mimeType: "video/mp4",
    };

    try {
      await addVideo(fakeMediaItem, null); // ownerId optional for now
      await load(); // refresh list after insert
    } catch (err) {
      console.error("Insert failed:", err);
      setError(err.message || String(err));
    } finally {
      setInserting(false);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h3>Videos from Supabase</h3>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleInsertTest} disabled={inserting}>
          {inserting ? "Inserting…" : "Insert test video"}
        </button>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>Error: {error}</div>}

      {videos.length === 0 && <p>No videos in the database yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {videos.map((v) => (
          <li key={v.id} style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <img
              src={v.thumbnail_url || v.base_url || "https://placekitten.com/160/100"}
              alt={v.title}
              style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 8 }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{v.title || v.id}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{v.created_at}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
