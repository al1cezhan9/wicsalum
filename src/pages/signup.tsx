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
      setMessage('An unexpected error occurred. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4FF] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#C8B6F0] rounded-lg p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#2E1A47] mb-1">Columbia Women in CS</h1>
            <p className="text-[#8B6AD9] text-sm">Alumni Directory</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#C8B6F0] text-gray-700 py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#673AB7] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Please use a personal email, not a Barnard/Columbia email
          </p>

          {message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
