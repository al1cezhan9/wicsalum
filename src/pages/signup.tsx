import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email.');
      return;
    }

    // validate email domain
    if (!email.endsWith('@columbia.edu') && !email.endsWith('@barnard.edu') && !email.endsWith('@alum.barnard.edu') && !email.endsWith('@caa.columbia.edu')) {
      setMessage('Please enter a valid @columbia.edu or @barnard.edu email.');
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
                @columbia.edu or @barnard.edu email required
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Magic Link...' : 'Sign In / Sign Up'}
            </button>
          </form>

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
