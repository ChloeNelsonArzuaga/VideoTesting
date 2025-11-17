

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  // replace with your Project URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;             // replace with your key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

