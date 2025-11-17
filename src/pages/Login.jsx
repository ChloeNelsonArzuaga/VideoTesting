import React from 'react';

export default function Login() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <div className="app-login">
      <div className="app-login-box">
        <h1>📸 Google Photos Picker</h1>
        <p>Sign in with your Google account to access your photos and videos</p>
        <button className="btn-signin" onClick={handleLogin}>
          Sign in with Google
        </button>
        <p className="login-hint">You'll be redirected to Google to authenticate securely</p>
      </div>
    </div>
  );
}
