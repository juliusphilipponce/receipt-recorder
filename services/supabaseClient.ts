import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment variables
// These are injected at build time by Vite (see vite.config.ts)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

let supabase: SupabaseClient | null = null;

// Initialize the Supabase client only if credentials are provided
// This allows the app to run without Supabase (with limited functionality)
if (supabaseUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error("Error initializing Supabase client:", error);
    }
} else {
    console.warn('Supabase credentials not found. Database features will be disabled.');
}

export { supabase };