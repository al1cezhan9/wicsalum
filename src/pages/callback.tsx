import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/auth';

export default function LoginCallback() {
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleLoginCallback = async () => {
      try {
        // Listen for auth state changes (this handles the magic link hash automatically)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
              
              // Process the user
              await processUser(session.user);
              subscription.unsubscribe();
            } else if (event === 'SIGNED_OUT' || !session) {
              // No session yet, try to get it
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession?.user) {
                await processUser(currentSession.user);
                subscription.unsubscribe();
              } else {
                // Wait a bit and check again
                setTimeout(async () => {
                  const { data: { session: retrySession } } = await supabase.auth.getSession();
                  if (retrySession?.user) {
                    await processUser(retrySession.user);
                  } else {
                    setMessage('No session found. Please try logging in again.');
                    setTimeout(() => {
                      window.location.href = '/signup';
                    }, 3000);
                  }
                  subscription.unsubscribe();
                }, 1500);
              }
            }
          }
        );

        // Also try getting session immediately (in case it's already processed)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user) {
          subscription.unsubscribe();
          await processUser(session.user);
        } else if (sessionError) {
          setMessage(`Error: ${sessionError.message}`);
          subscription.unsubscribe();
          setTimeout(() => {
            window.location.href = '/signup';
          }, 3000);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => {
          window.location.href = '/signup';
        }, 3000);
      }
    };

    const processUser = async (user: any) => {

      // Ensure user record exists in public.users table
      const { error: ensureError } = await supabase.rpc('ensure_user_exists');

      if (ensureError) {
        console.error('Error ensuring user record:', ensureError);
        // Try direct insert as fallback (with INSERT policy)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: 'alumni'
          })
          .select()
          .single();

        if (insertError) {
          setMessage(`Error: ${insertError.message}`);
          return;
        }
      }

      // Check if profile exists
      const profile = await getUserProfile();
      
      if (profile) {
        window.location.href = '/directory';
      } else {
        // No profile yet, redirect to registration
        window.location.href = '/register';
      }
    };

    handleLoginCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <p className="text-center text-gray-700">{message}</p>
      </div>
    </div>
  );
}
