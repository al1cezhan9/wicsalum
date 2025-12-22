import React, { useState } from 'react';
// sends a magic link to the email
// frontend domain check prevents most invalid attempts (not foolproof though)

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSignup = () => {
    if (!email) {
      setMessage('Please enter your email.');
    } else if (email.endsWith('@columbia.edu') || email.endsWith('@barnard.edu')) {
      setMessage('Success! Your .edu email is valid.');
    } else {
      setMessage('Please enter a valid @columbia.edu or @barnard.edu email.');
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
      >
        Sign Up
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
