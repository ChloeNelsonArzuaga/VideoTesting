import { useState, useCallback } from 'react';

/**
 * usePhotosPicker.js
 * 
 * Custom hook that handles all Google Photos Picker logic:
 * - Creating sessions
 * - Opening picker
 * - Polling for completion
 * - Fetching media items
 * 
 * Returns all state and handlers needed to display photos
 */

export function usePhotosPicker(initialSessionData = null) {
  const [sessionData, setSessionData] = useState(initialSessionData);
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pageToken, setPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Internal state for cleanup
  const [pollIntervalId, setPollIntervalId] = useState(null);
  const [pollTimeoutId, setPollTimeoutId] = useState(null);

  /**
   * Create a new picker session
   */
  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/photos/session', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create session');

      const data = await response.json();
      setSessionData(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('[usePhotosPicker] Error creating session:', err);
      return null;
    }
  }, []);

  /**
   * Fetch media items from backend
   */
  const fetchMediaItems = useCallback(async (token = null) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        pageSize: 50,
        ...(token && { pageToken: token }),
      });

      const response = await fetch(`/api/photos/media-items?${query}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.mediaItems || [];

      console.log(`[usePhotosPicker] Received ${items.length} items`);

      if (token) {
        setMediaItems((prev) => [...prev, ...items]);
      } else {
        setMediaItems(items);
      }

      setPageToken(data.nextPageToken || null);
      setHasMore(!!data.nextPageToken);

      return items;
    } catch (err) {
      console.error('[usePhotosPicker] Error fetching items:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Stop polling and clean up timers
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
      setPollTimeoutId(null);
    }
    setPolling(false);
    setError(null);
  }, [pollIntervalId, pollTimeoutId]);

  /**
   * Start polling to check when user finishes picking
   */
  const startPolling = useCallback(async () => {
    setPolling(true);
    console.log('[usePhotosPicker] Starting to poll for user selection...');

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/photos/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Poll failed');
        }

        const sessionData = await response.json();
        console.log('[usePhotosPicker] Poll response mediaItemsSet:', sessionData.mediaItemsSet);

        // Check if mediaItemsSet is true (user picked items)
        if (sessionData.mediaItemsSet) {
          console.log('[usePhotosPicker] User finished picking! Fetching items...');
          clearInterval(pollInterval);
          setPollIntervalId(null);
          setPolling(false);
          await fetchMediaItems();
        }
      } catch (err) {
        console.error('[usePhotosPicker] Poll error:', err);
      }
    }, 1000); // Poll every 1 second

    setPollIntervalId(pollInterval);

    // Stop polling after 5 minutes
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
      setPollIntervalId(null);
      setError('Polling timeout - picker took too long to respond');
    }, 300000);

    setPollTimeoutId(timeoutId);
  }, [fetchMediaItems]);

  /**
   * Open picker in new tab and start polling
   */
  const openPicker = useCallback(() => {
    if (!sessionData || !sessionData.pickerUri) {
      setError('No picker URI available');
      return;
    }

    console.log('[usePhotosPicker] Opening picker:', sessionData.pickerUri);

    // Open picker in new tab/window
    window.open(sessionData.pickerUri, 'GooglePhotosPicker', 'width=800,height=600');

    // Start polling to check if user picked items
    startPolling();
  }, [sessionData, startPolling]);

  /**
   * Toggle item selection
   */
  const toggleSelect = useCallback((id) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  /**
   * Get selected items
   */
  const getSelectedItems = useCallback(() => {
    return mediaItems.filter((item) => selectedItems.has(item.id));
  }, [mediaItems, selectedItems]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  /**
   * Load more items (pagination)
   */
  const loadMore = useCallback(() => {
    if (pageToken && hasMore) {
      fetchMediaItems(pageToken);
    }
  }, [pageToken, hasMore, fetchMediaItems]);

  /**
   * Reset everything
   */
  const reset = useCallback(() => {
    stopPolling();
    setSessionData(null);
    setMediaItems([]);
    setSelectedItems(new Set());
    setError(null);
    setPageToken(null);
    setHasMore(false);
  }, [stopPolling]);

  return {
    // State
    sessionData,
    mediaItems,
    selectedItems,
    loading,
    error,
    polling,
    pageToken,
    hasMore,

    // Methods
    createSession,
    openPicker,
    stopPolling,
    toggleSelect,
    getSelectedItems,
    clearSelection,
    loadMore,
    reset,
    fetchMediaItems,
  };
}
