import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // Handle Google Sign-In using Supabase OAuth (simpler and more reliable)
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setGoogleLoading(false);
      }
      // If successful, the page will redirect to Google
    } catch (err) {
      console.error('Google sign-in error:', err);
      setMessage('An unexpected error occurred with Google Sign-In. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email.');
      return;
    }

    // validate email domain
    if (!email.endsWith('@columbia.edu') && !email.endsWith('@barnard.edu') && !email.endsWith('@alum.barnard.edu') && !email.endsWith('@caa.columbia.edu')) {
      setMessage('Please enter a valid @columbia.edu, @barnard.edu, @alum.barnard.edu, or @caa.columbia.edu email.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // sends the magic link via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessage('Success! Check your email for the magic link to verify your account.');
      setLoading(false);
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Columbia Women in CS
            </h1>
            <h2 className="text-xl text-gray-600">Alumni Directory</h2>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Columbia Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="your.email@columbia.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                @columbia.edu, @barnard.edu, @alum.barnard.edu, or @caa.columbia.edu email required
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Magic Link...' : 'Sign In / Sign Up with Email'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google Logo SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign In with Google'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.startsWith('Success') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                message.startsWith('Success') ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
