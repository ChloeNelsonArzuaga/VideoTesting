

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vt-tags";

export default function useTags(initial = []) {
  const [tags, setTags] = useState(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTags(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    } catch (e) {}
  }, [tags]);

  const addTag = useCallback((tag) => {
    setTags((prev) => [{ ...tag, id: Date.now() }, ...prev]);
  }, []);

  const removeTag = useCallback((id) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const searchTags = useCallback(
    (q) => {
      const ql = q.trim().toLowerCase();
      if (!ql) return tags;
      return tags.filter((t) => t.text.toLowerCase().includes(ql));
    },
    [tags]
  );

  return { tags, addTag, removeTag, searchTags, setTags };
}
