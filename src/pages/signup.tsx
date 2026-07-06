import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SignupPage: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/callback` },
      });
      if (error) {
        setMessage(`Error: ${error.message}`);
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setMessage('An unexpected error occurred with Google Sign-In. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="inline-block rounded-full text-xs font-black uppercase tracking-widest mb-6"
            style={{
              background: 'var(--plum-50)',
              color: 'var(--plum-700)',
              border: '1px solid var(--plum-100)',
              padding: '0.5rem 1.25rem',
              letterSpacing: '0.16em',
            }}
          >
            Columbia Women in CS
          </div>
          <h1
            className="font-black"
            style={{ color: 'var(--plum-900)', fontSize: '2.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            Alumni Directory
          </h1>
          <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            Sign in to connect with the WiCS community.
          </p>
        </div>

        <div className="card p-8">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg font-bold text-sm"
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              opacity: googleLoading ? 0.6 : 1,
              fontFamily: 'Lato, sans-serif',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p className="text-xs mt-6 text-center" style={{ color: 'var(--muted)' }}>
            Please use a personal email (not a Barnard/Columbia email).
          </p>

          {message && (
            <div
              className="mt-6 p-3 rounded-lg text-sm"
              style={{
                background: message.startsWith('Success') ? '#EFF9F1' : '#FDECEC',
                color: message.startsWith('Success') ? '#1F6033' : '#8A1F1F',
                border: `1px solid ${message.startsWith('Success') ? '#CFEAD5' : '#F5CACA'}`,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
