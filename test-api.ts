import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const PANDAUTH_API = 'https://api.pandauth.com/api/v1';
const API_KEY = process.env.PANDAUTH_API_KEY || '';
const headers = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testDeleteEndpoints(keyValue: string) {
    const endpoints = [
        { method: 'DELETE', url: `${PANDAUTH_API}/keys/api/key?key=${keyValue}` },
        { method: 'DELETE', url: `${PANDAUTH_API}/keys/api/generated-key?key=${keyValue}` },
        { method: 'DELETE', url: `${PANDAUTH_API}/keys/${keyValue}` },
        { method: 'POST', url: `${PANDAUTH_API}/keys/api/delete`, data: { key: keyValue } },
        { method: 'POST', url: `${PANDAUTH_API}/keys/api/remove`, data: { key: keyValue } },
        { method: 'PATCH', url: `${PANDAUTH_API}/keys/api/key`, data: { key: keyValue, expirationDays: 30 } },
        { method: 'PUT', url: `${PANDAUTH_API}/keys/api/key`, data: { key: keyValue, expirationDays: 30 } },
        { method: 'POST', url: `${PANDAUTH_API}/keys/api/update`, data: { key: keyValue, expirationDays: 30 } },
    ];

    console.log(`\n🔍 Testing API endpoints for key: ${keyValue}\n`);

    for (const ep of endpoints) {
        try {
            const res = await axios({
                method: ep.method as any,
                url: ep.url,
                headers,
                data: ep.data,
                validateStatus: () => true // Don't throw on any status
            });
            console.log(`${ep.method} ${ep.url.replace(PANDAUTH_API, '')}`);
            console.log(`  Status: ${res.status}`);
            console.log(`  Response: ${JSON.stringify(res.data).substring(0, 200)}`);
            console.log('');
        } catch (err: any) {
            console.log(`${ep.method} ${ep.url.replace(PANDAUTH_API, '')}`);
            console.log(`  Error: ${err.message}`);
            console.log('');
        }
    }
}

async function main() {
    console.log('=== Pandauth API Endpoint Discovery ===\n');
    console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`Supabase URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);

    // First, get a test key from Supabase
    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: keys } = await supabase.from('keys').select('*').limit(1);
        
        if (keys && keys.length > 0) {
            const testKey = keys[0].key_value;
            console.log(`\nTest key from DB: ${testKey}`);
            
            // First get key info
            try {
                const info = await axios.get(`${PANDAUTH_API}/keys/api/generated-key?key=${testKey}`, { headers, validateStatus: () => true });
                console.log(`\nKey info status: ${info.status}`);
                console.log(`Key info: ${JSON.stringify(info.data).substring(0, 500)}`);
            } catch (e: any) {
                console.log(`Get key error: ${e.message}`);
            }

            await testDeleteEndpoints(testKey);
        } else {
            console.log('No keys found in DB');
        }
    } else {
        console.log('Supabase not configured, testing with dummy key');
        await testDeleteEndpoints('VIP-TEST-0000-0000-0000');
    }
}

main().catch(console.error);
