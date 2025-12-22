import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginCallback() {
  const [message, setMessage] = useState('Checking login...');

  useEffect(() => {
    const handleLoginCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }

      if (!session?.user) {
        setMessage('No session found. Please try logging in again.');
        return;
      }

      const user = session.user;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Insert new user
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            created_at: new Date()
          });

        if (insertError) {
          setMessage(`Error creating user: ${insertError.message}`);
          return;
        }
      }

      // redirect to dashboard / profile
      window.location.href = '/dashboard';
    };

    handleLoginCallback();
  }, []);

  return <p>{message}</p>;
}
