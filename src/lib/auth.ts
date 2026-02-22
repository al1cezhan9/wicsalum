import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  graduation_year: number;
  current_company: string;
  job_title?: string;
  current_city: string;
  bio: string;
  email?: string;
  linkedin_url?: string;
  sector?: string;
  member_status?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  email: string;
  role: 'alumni' | 'admin';
  created_at: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as UserRole;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function signOut() {
  await supabase.auth.signOut();
}

