import React from 'react';
import { usePhotosPicker } from '../hooks/usePhotosPicker';

/**
 * PhotosPicker.jsx
 * 
 * Minimal picker UI component that displays:
 * - Pick button
 * - Media grid
 * - Selection controls
 * 
 * All business logic is handled by usePhotosPicker hook
 */

export default function PhotosPicker({ sessionData }) {
  const {
    mediaItems,
    selectedItems,
    loading,
    error,
    polling,
    hasMore,
    openPicker,
    stopPolling,
    toggleSelect,
    clearSelection,
    loadMore,
  } = usePhotosPicker(sessionData);

  const handleLogSelection = () => {
    const selected = mediaItems.filter((item) => selectedItems.has(item.id));
    console.log('[PhotosPicker] Selected items:', selected);
    alert(`Selected ${selected.length} item(s). Check console for details.`);
  };

  if (!sessionData) {
    return (
      <div className="picker-error">
        ⚠️ No session available
      </div>
    );
  }

  return (
    <div className="picker-container">
      {/* Header */}
      <div className="picker-header">
        <div className="picker-header-left">
          <h3>Select Photos & Videos</h3>
          <p>
            {selectedItems.size} selected out of {mediaItems.length}
            {polling && ' • Waiting for your selection...'}
          </p>
        </div>
        <div className="picker-header-buttons">
          <button
            onClick={openPicker}
            disabled={polling}
            className="picker-btn picker-btn-primary"
          >
            {polling ? '⏳ Waiting...' : '📸 Pick Photos'}
          </button>
          {polling && (
            <button
              onClick={stopPolling}
              className="picker-btn picker-btn-cancel"
            >
              Cancel
            </button>
          )}
          {mediaItems.length > 0 && (
            <>
              <button
                onClick={handleLogSelection}
                disabled={selectedItems.size === 0}
                className="picker-btn picker-btn-library"
              >
                Log Selection ({selectedItems.size})
              </button>
              <button
                onClick={clearSelection}
                className="picker-btn picker-btn-clear"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="picker-error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Media Grid */}
      {mediaItems.length === 0 ? (
        <div className="picker-empty">
          <p>📸 No photos selected yet</p>
          <button
            onClick={openPicker}
            disabled={polling}
            className="picker-btn picker-btn-primary"
          >
            Click here to pick photos
          </button>
        </div>
      ) : (
        <>
          <div className="picker-grid">
            {mediaItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const isVideo = item.mimeType?.startsWith('video/');

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`picker-grid-item ${isSelected ? 'selected' : ''}`}
                >
                  <img
                    alt={item.filename}
                    src={`${item.baseUrl}=w120-h120`}
                  />
                  {isVideo && (
                    <div className="picker-grid-item-video-badge">
                      ▶️ VIDEO
                    </div>
                  )}
                  {isSelected && (
                    <div className="picker-grid-item-checkmark">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="picker-load-more-container">
              <button
                onClick={loadMore}
                disabled={loading}
                className="picker-btn picker-btn-library"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="picker-tip">
        💡 Click "Pick Photos" to open the picker in a new tab. Pick your photos there, then this page will automatically load them!
      </div>
    </div>
  );
}
