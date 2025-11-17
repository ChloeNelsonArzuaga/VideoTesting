import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Library() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mediaItems, setMediaItems] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageToken, setPrevPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMetadata, setSelectedMetadata] = useState([]);
  const [thumbnailCache, setThumbnailCache] = useState({});
  const currentPageToken = searchParams.get('pageToken');

  const loadImageBlob = async (baseUrl, sizeParams = '') => {
    try {
      const response = await fetch('/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseUrl: baseUrl + sizeParams }),
      });
      if (!response.ok) throw new Error('Failed to load image');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('[Library] Error loading image:', err);
      return null;
    }
  };

  const loadVideoBlob = async (baseUrl) => {
    try {
      const response = await fetch('/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseUrl }),
      });
      if (!response.ok) throw new Error('Failed to load video');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('[Library] Error loading video:', err);
      return null;
    }
  };

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        ...(currentPageToken && { pageToken: currentPageToken }),
      });
      const response = await fetch(`/fetch_images?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to fetch images: ${response.statusText}`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const images = data.images;
      setMediaItems(images.mediaItems || []);
      setNextPageToken(images.nextPageToken || null);
      setPrevPageToken(currentPageToken || null);
    } catch (err) {
      console.error('[Library] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [currentPageToken]);

  useEffect(() => {
    mediaItems.forEach((item) => {
      const cacheKey = `${item.id}-thumb`;
      if (!thumbnailCache[cacheKey] && item.mediaFile?.baseUrl) {
        loadImageBlob(item.mediaFile.baseUrl, '=w128-h128').then((url) => {
          if (url) {
            setThumbnailCache((prev) => ({ ...prev, [cacheKey]: url }));
          }
        });
      }
    });
  }, [mediaItems, thumbnailCache]);

  const handleNewSession = async () => {
    try {
      const response = await fetch('/new_session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      navigate('/');
    } catch (err) {
      console.error('[Library] Error creating new session:', err);
      setError(err.message);
    }
  };

  const handleMediaClick = (item) => {
    setSelectedItem(item);
    const metadata = [];
    const meta = item.mediaFile?.mediaFileMetadata;
    if (meta) {
      Object.keys(meta).forEach((key) => {
        const value = meta[key];
        if (typeof value === 'object') {
          Object.keys(value).forEach((valueKey) => {
            metadata.push([valueKey, value[valueKey]]);
          });
        } else {
          metadata.push([key, value]);
        }
      });
    }
    setSelectedMetadata(metadata);
  };

  const handleDownloadMedia = async (item) => {
    if (item.type === 'VIDEO') {
      await downloadVideo(item.mediaFile.baseUrl);
    } else {
      await downloadImage(item.mediaFile.baseUrl);
    }
  };

  const downloadImage = async (baseUrl) => {
    try {
      const response = await fetch('/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseUrl }),
      });
      if (!response.ok) throw new Error('Failed to download image');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Library] Download error:', err);
      setError(err.message);
    }
  };

  const downloadVideo = async (baseUrl) => {
    try {
      const response = await fetch('/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseUrl }),
      });
      if (!response.ok) throw new Error('Failed to download video');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Library] Download error:', err);
      setError(err.message);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedMetadata([]);
  };

  return (
    <div className="library-page">
      <div className="library-header-bar">
        <h1>📚 Selected Media</h1>
        <div className="header-buttons">
          <button onClick={handleNewSession} className="btn btn-primary">
            Change Selection
          </button>
          <a href="/api/auth/logout" className="btn btn-danger">
            Disconnect
          </a>
        </div>
      </div>

      <div className="library-content">
        {error && <div className="error-message">⚠️ {error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="empty-state">
            <p>No media items selected</p>
            <button onClick={handleNewSession} className="btn btn-primary">
              Pick Photos
            </button>
          </div>
        ) : (
          <>
            <div className="hint">Click on an image to see details</div>
            <div className="media-grid">
              {mediaItems.map((item, idx) => {
                const isVideo = item.type === 'VIDEO';
                const cacheKey = `${item.id}-thumb`;
                const thumbnailUrl = thumbnailCache[cacheKey];
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="media-thumbnail"
                    onClick={() => handleMediaClick(item)}
                  >
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={item.mediaFile.filename} className="thumbnail-img" />
                    ) : (
                      <div className="thumbnail-placeholder">Loading...</div>
                    )}
                    {isVideo && <div className="video-badge">▶️ VIDEO</div>}
                  </div>
                );
              })}
            </div>

            <div className="pagination">
              <div>
                {prevPageToken && (
                  <button onClick={() => navigate('/library')} className="btn btn-secondary">
                    ← Previous
                  </button>
                )}
              </div>
              <div>
                {nextPageToken && (
                  <button onClick={() => navigate(`/library?pageToken=${nextPageToken}`)} className="btn btn-secondary">
                    Next →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedItem && (
        <ModalViewer
          item={selectedItem}
          metadata={selectedMetadata}
          onClose={closeModal}
          loadImageBlob={loadImageBlob}
          loadVideoBlob={loadVideoBlob}
          handleDownloadMedia={handleDownloadMedia}
        />
      )}
    </div>
  );
}

function ModalViewer({ item, metadata, onClose, loadImageBlob, loadVideoBlob, handleDownloadMedia }) {
  const [displayUrl, setDisplayUrl] = useState(null);
  const [displayLoading, setDisplayLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [item.id]);

  const loadMedia = async () => {
    setDisplayLoading(true);
    try {
      if (item.type === 'VIDEO') {
        const url = await loadVideoBlob(item.mediaFile.baseUrl);
        setDisplayUrl(url);
      } else {
        const url = await loadImageBlob(item.mediaFile.baseUrl, '');
        setDisplayUrl(url);
      }
    } catch (err) {
      console.error('[ModalViewer] Error loading media:', err);
    } finally {
      setDisplayLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {displayLoading ? (
          <div className="modal-media-placeholder">
            <div className="spinner"></div>
            <p>Loading media...</p>
          </div>
        ) : displayUrl ? (
          item.type === 'VIDEO' ? (
            <video controls className="modal-media" src={displayUrl} />
          ) : (
            <img src={displayUrl} alt={item.mediaFile.filename} className="modal-media" />
          )
        ) : (
          <div className="modal-media-placeholder">Failed to load media</div>
        )}

        <div className="modal-info">
          <h3>{item.mediaFile.filename}</h3>
          {metadata.length > 0 && (
            <table className="metadata-table">
              <tbody>
                {metadata.map(([key, value], idx) => (
                  <tr key={idx}>
                    <td className="metadata-key">{key}</td>
                    <td className="metadata-value">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={() => handleDownloadMedia(item)} className="btn btn-success">
            ⬇️ Download
          </button>
        </div>
      </div>
    </div>
  );
}
