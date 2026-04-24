import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/auth';

export default function LoginCallback() {
  const [message, setMessage] = useState('Signing you in...');

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
                    setMessage('No session found. Redirecting...');
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
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email, role: 'non-admin' })
          .select()
          .single();
        if (insertError) {
          setMessage(`Error: ${insertError.message}`);
          return;
        }
      }
      const profile = await getUserProfile();
      window.location.href = profile ? '/directory' : '/register';
    };

    handleLoginCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4FF] flex items-center justify-center">
      <div className="bg-white border border-[#C8B6F0] rounded-lg p-10 max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C8B6F0] border-t-[#673AB7] mx-auto mb-4"></div>
        <p className="text-[#2E1A47] text-sm">{message}</p>
      </div>
    </div>
  );
}
