import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PANDAUTH_API = 'https://api.pandauth.com/api/v1';
const API_KEY = process.env.PANDAUTH_API_KEY;

if (!API_KEY) {
    console.warn("PANDAUTH_API_KEY is not defined in environment variables.");
}

const headers = {
    'X-API-Key': API_KEY || '',
    'Content-Type': 'application/json'
};



export const panda = {
    generateKey: async (options: {
        count?: number,
        prefix?: string,
        expirationType?: string,
        expirationDays?: number,
        isPremium?: boolean,
        noHwidValidation?: boolean,
        note?: string | null
    } = {}) => {
        try {
            const payload = {
                count: options.count || 1,
                prefix: options.prefix || 'VIP',
                expirationType: 'bySeconds',
                expirationSeconds: 2592000, // 30 days in seconds
                isPremium: options.isPremium !== undefined ? options.isPremium : true,
                noHwidValidation: options.noHwidValidation || false
            };

            const response = await axios.post(`${PANDAUTH_API}/keys/api/generate`, payload, { headers });

            if (response.data?.data?.keys && response.data.data.keys.length > 0) {
                return response.data.data.keys[0].value; // Return the key string
            } else {
                throw new Error("API responded but no keys were generated.");
            }
        } catch (error: any) {
            console.error("Pandauth API Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to generate key from Pandauth");
        }
    },

    extendKey: async (key: string, days: number = 30) => {
        try {
            // First check if key exists and is active
            const keyInfo = await panda.getKey(key);
            
            if (!keyInfo) {
                throw new Error("Key not found in Pandauth. It may have been deleted.");
            }
            
            if (!keyInfo.isActive) {
                throw new Error("Cannot extend an unused key. Please use the key in-game once before renewing.");
            }

            const response = await axios.post(
                `${PANDAUTH_API}/keys/api/key/extend-expiration`,
                { key, days },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Pandauth Extend Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message || "Failed to extend key");
        }
    },

    getKey: async (key: string) => {
        try {
            // 1. Try active key first
            try {
                const activeRes = await axios.get(`${PANDAUTH_API}/keys/api/key?key=${key}`, { headers });
                if (activeRes.data?.data) {
                    const keyData = activeRes.data.data.key || activeRes.data.data;
                    return { data: keyData, isActive: true };
                }
            } catch (err: any) {
                // Ignore 404/400, means it's not in active list
            }

            // 2. Try generated (unused) key
            try {
                const genRes = await axios.get(`${PANDAUTH_API}/keys/api/generated-key?key=${key}`, { headers });
                if (genRes.data?.data) {
                    const keyData = genRes.data.data.key || genRes.data.data;
                    return { data: keyData, isActive: false };
                }
            } catch (err: any) {
                // Ignore 404/400
            }
            return null; // Not found anywhere
        } catch (error: any) {
            console.error("Pandauth API Error in getKey:", error.response?.data || error.message);
            return null;
        }
    },


};
