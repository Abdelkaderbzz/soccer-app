import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Create regular client for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client for elevated operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const isSupabaseConfigured =
  !supabaseUrl.includes('placeholder') &&
  !supabaseServiceKey.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');
