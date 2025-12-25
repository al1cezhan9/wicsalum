import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// frontend domain check prevents most invalid attempts 
// (not foolproof though, set integrity constraint in supabase)
// no that we are going to have crazy cyber attackers LOL

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    if (!email) {
      setMessage('Please enter your email.');
      return;
    }

    // validate email domain
    if (!email.endsWith('@columbia.edu') && !email.endsWith('@barnard.edu')) {
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
    <div>
      <h1>Sign Up</h1>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleSignup}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Sign Up'}
      </button>
      {message && (
        <p style={{ color: message.startsWith('Success') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SignupPage;
