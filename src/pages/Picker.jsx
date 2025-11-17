import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Picker() {
  const navigate = useNavigate();
  const [pickerUri, setPickerUri] = useState(null);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    getSessionAndPoll();
  }, []);

  const getSessionAndPoll = async () => {
    try {
      const response = await fetch('/get_session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data['auth-error']) {
        setError('Not authenticated');
        navigate('/');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      // If user already completed picking
      if (data.mediaItemsSet) {
        navigate('/library');
        return;
      }

      // Set the picker URI
      setPickerUri(data.pickerUri);
      setPolling(true);

      // Start polling
      pollForCompletion();
    } catch (err) {
      console.error('[Picker] Error:', err);
      setError(err.message);
    }
  };

  const pollForCompletion = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/get_session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (data.mediaItemsSet) {
          clearInterval(pollInterval);
          setPolling(false);
          navigate('/library');
        }
      } catch (err) {
        console.error('[Picker] Poll error:', err);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleOpenPicker = () => {
    if (pickerUri) {
      window.open(pickerUri, 'GooglePhotosPicker', 'width=800,height=700');
    }
  };

  const handleNewSession = async () => {
    try {
      const response = await fetch('/new_session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setPickerUri(data.pickerUri);
      setError(null);
      setPolling(true);
      pollForCompletion();
    } catch (err) {
      console.error('[Picker] Error creating new session:', err);
      setError(err.message);
    }
  };

  return (
    <div className="picker-page">
      <div className="picker-header-bar">
        <h1>📸 Google Photos Picker</h1>
        <a href="/api/auth/logout" className="btn btn-danger">
          Disconnect
        </a>
      </div>

      <div className="picker-content">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {pickerUri && !polling ? (
          <div className="picker-section">
            <h2>Pick your photos & videos</h2>
            <p>Click the button below to open the Google Photos Picker:</p>
            <button
              onClick={handleOpenPicker}
              className="btn btn-primary btn-large"
            >
              Open Photos Picker
            </button>
          </div>
        ) : polling ? (
          <div className="picker-section">
            <div className="spinner"></div>
            <h2>⏳ Waiting for your selection...</h2>
            <p>A new window should have opened. If not, click the button below:</p>
            <button
              onClick={handleOpenPicker}
              className="btn btn-primary btn-large"
            >
              Open Photos Picker
            </button>
            <p className="hint">This page will automatically update when you're done</p>
            <button
              onClick={handleNewSession}
              className="btn btn-secondary"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="picker-section">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
