import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/auth';

export default function LoginCallback() {
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const handleLoginCallback = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              window.history.replaceState(null, '', window.location.pathname);
              await processUser(session.user);
              subscription.unsubscribe();
            } else if (event === 'SIGNED_OUT' || !session) {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession?.user) {
                await processUser(currentSession.user);
                subscription.unsubscribe();
              } else {
                setTimeout(async () => {
                  const { data: { session: retrySession } } = await supabase.auth.getSession();
                  if (retrySession?.user) {
                    await processUser(retrySession.user);
                  } else {
                    setMessage('No session found. Please try logging in again.');
                    setTimeout(() => { window.location.href = '/signup'; }, 3000);
                  }
                  subscription.unsubscribe();
                }, 1500);
              }
            }
          }
        );

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          subscription.unsubscribe();
          await processUser(session.user);
        } else if (sessionError) {
          setMessage(`Error: ${sessionError.message}`);
          subscription.unsubscribe();
          setTimeout(() => { window.location.href = '/signup'; }, 3000);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => { window.location.href = '/signup'; }, 3000);
      }
    };

    const processUser = async (user: any) => {
      const { error: ensureError } = await supabase.rpc('ensure_user_exists');
      if (ensureError) {
        console.error('Error ensuring user record:', ensureError);
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email, role: 'non-admin' })
          .select()
          .single();
        if (insertError) { setMessage(`Error: ${insertError.message}`); return; }
      }

      const profile = await getUserProfile();
      window.location.href = profile ? '/directory' : '/register';
    };

    handleLoginCallback();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper)' }}
    >
      <div className="card p-8 max-w-md w-full text-center">
        <div
          className="inline-block w-8 h-8 rounded-full animate-spin mb-4"
          style={{
            border: '3px solid var(--plum-100)',
            borderTopColor: 'var(--plum-700)',
          }}
        />
        <p style={{ color: 'var(--ink)' }}>{message}</p>
      </div>
    </div>
  );
}
