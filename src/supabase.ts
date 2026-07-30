import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

// Polyfill WebSocket for Node < 22 to prevent Supabase RealtimeClient crashes
if (!globalThis.WebSocket) {
    (globalThis as any).WebSocket = WebSocket;
}

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use SERVICE_ROLE_KEY for admin access if available, otherwise fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let client: any = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing from the environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
} else {
    const isUsingServiceRole = supabaseKey.includes('service_role');
    console.log(`[Supabase] Initializing client... Using Service Role Key? ${isUsingServiceRole}`);
    client = createClient(supabaseUrl, supabaseKey);
}

export const supabase = client;

// Placeholder for Pandauth.com integration
export const pandauth = {
    // Add pandauth methods here later
    validateVoucher: async (voucher: string) => {
        console.log(`[Pandauth Placeholder] Validating voucher: ${voucher}`);
        return true;
    }
};
