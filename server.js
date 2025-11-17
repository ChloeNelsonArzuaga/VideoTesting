/**
 * server.js - Rewritten to match sample app's approach
 * 
 * Key differences from before:
 * - Uses persist cache to store sessions
 * - Stores sessions keyed by user.profile.id
 * - Returns pickerUri in session data
 * - Simplified endpoints that match sample app exactly
 */

import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import axios from 'axios';
import cors from 'cors';
import persist from 'node-persist';
import stream from 'stream';

// Load config
let config;
try {
  config = (await import('./config.cjs')).config;
} catch (err) {
  console.error('ERROR: config.cjs not found. Please create it with your OAuth credentials.');
  console.error('See config-example.cjs for template.');
  process.exit(1);
}

const app = express();

// Initialize session cache (stores picker sessions)
const sessionCache = persist.create({
  dir: 'persist-session/',
  ttl: 1740000,  // 29 minutes
});
await sessionCache.init();

// Middleware
app.use(cors({ 
  origin: 'http://localhost:5173',
  credentials: true 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: config.session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: config.oAuthClientID,
  clientSecret: config.oAuthclientSecret,
  callbackURL: config.oAuthCallbackUrl,
}, (accessToken, refreshToken, profile, done) => {
  console.log('[OAuth] User authenticated:', profile.displayName);
  return done(null, {
    id: profile.id,
    profile: profile,
    token: accessToken,
  });
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ============================================
// OAUTH ROUTES
// ============================================

app.get('/auth/google', passport.authenticate('google', {
  scope: config.scopes,
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/VideoTesting/');
  }
);

// ============================================
// API ROUTES
// ============================================

// Check if user is authenticated
app.get('/api/auth/me', (req, res) => {
  if (req.user && req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        displayName: req.user.profile.displayName,
        email: req.user.profile.emails?.[0]?.value,
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
app.get('/api/auth/logout', (req, res) => {
  if (req.user) {
    sessionCache.removeItem(req.user.profile.id).catch(err => {
      console.error('Error removing cached session:', err);
    });
  }
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    req.session.destroy();
    res.json({ success: true });
  });
});

// Create a new photos picker session
const createNewSession = async (req, res) => {
  try {
    console.log('[createNewSession] Creating session for user:', req.user?.id);
    
    const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.user.token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[createNewSession] Google API error:', errorText);
      throw new Error(`Google API error: ${response.statusText} - ${errorText}`);
    }

    const sessionData = await response.json();
    console.log('[createNewSession] Session created:', sessionData.id);
    
    // Cache the session
    await sessionCache.setItem(req.user.profile.id, sessionData);
    
    res.json(sessionData);
  } catch (err) {
    console.error('[createNewSession] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /get_session - Check session status (polls if picking complete)
app.get('/get_session', async (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.json({ 'auth-error': 'not authenticated' });
  }

  try {
    let cachedSession = await sessionCache.getItem(req.user.profile.id);
    
    // If no cached session, create one
    if (!cachedSession || !cachedSession.id) {
      console.log('[GET /get_session] No cached session, creating new one');
      
      const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.user.token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GET /get_session] Google API error creating session:', errorText);
        return res.json({ error: `Failed to create session: ${errorText}` });
      }

      cachedSession = await response.json();
      console.log('[GET /get_session] New session created:', cachedSession.id);
      await sessionCache.setItem(req.user.profile.id, cachedSession);
      return res.json(cachedSession);
    }

    console.log('[GET /get_session] Checking cached session:', cachedSession.id);

    const response = await fetch(
      `https://photospicker.googleapis.com/v1/sessions/${cachedSession.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.user.token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GET /get_session] Google API error:', errorText);
      return res.json({ error: errorText });
    }

    const sessionData = await response.json();
    console.log('[GET /get_session] mediaItemsSet:', sessionData.mediaItemsSet);
    
    // Update cache
    await sessionCache.setItem(req.user.profile.id, sessionData);
    
    res.json(sessionData);
  } catch (err) {
    console.error('[GET /get_session] Error:', err);
    res.json({ error: err.message });
  }
});

// GET /fetch_images - Fetch media items from completed picker session
app.get('/fetch_images', async (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.json({ error: 'Not authenticated' });
  }

  try {
    const { pageToken } = req.query;
    const cachedSession = await sessionCache.getItem(req.user.profile.id);
    
    if (!cachedSession || !cachedSession.id) {
      return res.json({ error: 'No session found' });
    }

    const pageSize = 25;
    let itemsQuery = `sessionId=${cachedSession.id}&pageSize=${pageSize}`;
    if (pageToken) {
      itemsQuery += `&pageToken=${pageToken}`;
    }

    console.log('[GET /fetch_images] Fetching:', itemsQuery);

    const response = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?${itemsQuery}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.user.token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GET /fetch_images] Google API error:', errorText);
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[GET /fetch_images] Received', data.mediaItems?.length || 0, 'items');
    
    res.json({ images: data });
  } catch (err) {
    console.error('[GET /fetch_images] Error:', err);
    res.json({ error: err.message });
  }
});

// POST /image - Download image
app.post('/image', async (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { baseUrl } = req.body;

    if (!baseUrl) {
      return res.status(400).json({ error: 'baseUrl required' });
    }

    console.log('[POST /image] Downloading image');

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${req.user.token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    res.set('Content-Type', response.headers.get('content-type'));
    res.set('Content-Disposition', response.headers.get('content-disposition') || 'attachment; filename="photo.jpg"');
    response.body.pipe(res);
  } catch (err) {
    console.error('[POST /image] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /video - Download video
app.post('/video', async (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { baseUrl } = req.body;

    if (!baseUrl) {
      return res.status(400).json({ error: 'baseUrl required' });
    }

    const videoUrl = baseUrl + '=dv';
    console.log('[POST /video] Downloading video');

    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${req.user.token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    res.set('Content-Type', response.headers.get('content-type'));
    res.set('Content-Disposition', response.headers.get('content-disposition') || 'attachment; filename="video.mp4"');
    response.body.pipe(res);
  } catch (err) {
    console.error('[POST /video] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /new_session - Create a new picker session
app.get('/new_session', async (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.json({ 'auth-error': 'not authenticated' });
  }

  try {
    await createNewSession(req, res);
  } catch (err) {
    console.error('[GET /new_session] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Make sure your Vite React app is running on http://localhost:5173`);
  console.log(`✓ OAuth callback configured for: ${config.oAuthCallbackUrl}`);
});
