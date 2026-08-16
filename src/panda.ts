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

export interface GenerateKeyOptions {
    count?: number;
    prefix?: string;
    expirationType?: 'byDays' | 'byDate' | 'lifetime' | string;
    expirationDays?: number;
    expiresAt?: string;
    isPremium?: boolean;
    noHwidValidation?: boolean;
    note?: string | null;
    discordId?: string | null;
}

export interface EditKeyOptions {
    note?: string | null;
    hwid?: string | null;
    isPremium?: boolean;
    noHwidValidation?: boolean;
    status?: string;
    expiresAt?: string;
    discordId?: string | null;
}

export const panda = {
    /**
     * Generate one or more keys and optionally bind Discord ID and Note to them.
     */
    generateKey: async (options: GenerateKeyOptions = {}): Promise<string> => {
        try {
            const expType = options.expirationType || 'byDays';
            const payload: any = {
                count: options.count || 1,
                prefix: options.prefix || 'VIP',
                expirationType: expType,
                isPremium: options.isPremium !== undefined ? options.isPremium : true,
                noHwidValidation: options.noHwidValidation !== undefined ? options.noHwidValidation : true
            };

            if (expType === 'byDays') {
                payload.expirationDays = options.expirationDays !== undefined ? options.expirationDays : 30;
            } else if (expType === 'byDate' && options.expiresAt) {
                payload.expiresAt = options.expiresAt;
            }

            if (options.note) {
                payload.note = options.note;
            }

            const response = await axios.post(`${PANDAUTH_API}/keys/api/generate`, payload, { headers });

            const generatedKeys = response.data?.data?.keys;
            if (generatedKeys && generatedKeys.length > 0) {
                const keyValue = generatedKeys[0].value;

                // If discordId or note was provided, bind to generated key via PUT /keys/api/generated-key
                if (options.discordId || options.note) {
                    try {
                        await panda.editGeneratedKey(keyValue, {
                            discordId: options.discordId,
                            note: options.note
                        });
                    } catch (bindErr: any) {
                        console.warn("Failed to bind discordId/note to generated key in Pandauth:", bindErr.message);
                    }
                }

                return keyValue;
            } else {
                throw new Error("API responded but no keys were generated.");
            }
        } catch (error: any) {
            console.error("Pandauth Generate Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to generate key from Pandauth");
        }
    },

    /**
     * Edit a generated (unredeemed) key.
     */
    editGeneratedKey: async (key: string, data: EditKeyOptions) => {
        try {
            const response = await axios.put(
                `${PANDAUTH_API}/keys/api/generated-key`,
                { key, ...data },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Pandauth Edit Generated Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to edit generated key");
        }
    },

    /**
     * Edit an active (redeemed) key.
     */
    editActiveKey: async (key: string, data: EditKeyOptions) => {
        try {
            const response = await axios.put(
                `${PANDAUTH_API}/keys/api/key`,
                { key, ...data },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Pandauth Edit Active Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to edit active key");
        }
    },

    /**
     * Extend a key's expiration by a given number of days.
     * Works for active keys (via extend-expiration) and generated keys (via editGeneratedKey).
     */
    extendKey: async (key: string, days: number = 30) => {
        try {
            const keyInfo = await panda.getKey(key);

            if (!keyInfo) {
                throw new Error("Key not found in Pandauth. It may have been deleted.");
            }

            if (keyInfo.isActive) {
                // Active key extension
                const response = await axios.post(
                    `${PANDAUTH_API}/keys/api/key/extend-expiration`,
                    { key, days },
                    { headers }
                );
                return response.data;
            } else {
                // Generated / unused key extension
                const currentExpiresAt = keyInfo.data?.expiresAt ? new Date(keyInfo.data.expiresAt) : new Date();
                const newExpiresAt = new Date(currentExpiresAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

                return await panda.editGeneratedKey(key, {
                    expiresAt: newExpiresAt
                });
            }
        } catch (error: any) {
            console.error("Pandauth Extend Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to extend key");
        }
    },

    /**
     * Fetch key info (searches active and generated keys).
     */
    getKey: async (key: string) => {
        try {
            // 1. Try active key first
            try {
                const activeRes = await axios.get(`${PANDAUTH_API}/keys/api/key?key=${encodeURIComponent(key)}`, { headers });
                if (activeRes.data?.data) {
                    const keyData = activeRes.data.data.key || activeRes.data.data;
                    return { data: keyData, isActive: true };
                }
            } catch (err: any) {
                // Ignore 404/400
            }

            // 2. Try generated (unused) key
            try {
                const genRes = await axios.get(`${PANDAUTH_API}/keys/api/generated-key?key=${encodeURIComponent(key)}`, { headers });
                if (genRes.data?.data) {
                    const keyData = genRes.data.data.key || genRes.data.data;
                    return { data: keyData, isActive: false };
                }
            } catch (err: any) {
                // Ignore 404/400
            }

            return null;
        } catch (error: any) {
            console.error("Pandauth API Error in getKey:", error.response?.data || error.message);
            return null;
        }
    },

    /**
     * Fetch every key bound to a Discord user (searches both generated and active keys).
     */
    getKeysByDiscord: async (discordId: string, includeLoadstring: boolean = true) => {
        try {
            const url = `${PANDAUTH_API}/keys/api/key/by-discord?discordId=${encodeURIComponent(discordId)}${includeLoadstring ? '&includeLoadstring=1' : ''}`;
            const response = await axios.get(url, { headers });
            return response.data?.data || [];
        } catch (error: any) {
            console.error("Pandauth getKeysByDiscord Error:", error.response?.data || error.message);
            return [];
        }
    },

    /**
     * Delete a key (attempts deletion from active keys, then generated keys).
     */
    deleteKey: async (key: string) => {
        try {
            // Try active key
            try {
                const res = await axios.delete(`${PANDAUTH_API}/keys/api/key?key=${encodeURIComponent(key)}`, { headers });
                if (res.data?.success) return res.data;
            } catch (e) {
                // continue
            }

            // Try generated key
            const resGen = await axios.delete(`${PANDAUTH_API}/keys/api/generated-key?key=${encodeURIComponent(key)}`, { headers });
            return resGen.data;
        } catch (error: any) {
            console.error("Pandauth Delete Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to delete key");
        }
    },

    /**
     * Reset HWID for a key (unbinds HWID).
     */
    resetHwid: async (key: string) => {
        try {
            const endpoints = [
                { url: `${PANDAUTH_API}/keys/reset-hwid`, method: 'POST' as const, body: { key } },
                { url: `${PANDAUTH_API}/keys/api/key/reset-hwid`, method: 'POST' as const, body: { key } },
                { url: `${PANDAUTH_API}/keys/api/key`, method: 'PUT' as const, body: { key, hwid: null, noHwidValidation: true } },
                { url: `${PANDAUTH_API}/keys/api/generated-key`, method: 'PUT' as const, body: { key, hwid: null, noHwidValidation: true } }
            ];

            for (const ep of endpoints) {
                try {
                    const res = await axios({
                        method: ep.method,
                        url: ep.url,
                        data: ep.body,
                        headers
                    });
                    if (res.data) return res.data;
                } catch (e) {
                    // Continue to next endpoint
                }
            }
            return { success: true };
        } catch (error: any) {
            console.error("Pandauth Reset HWID Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to reset HWID");
        }
    },

    /**
     * Check key binding status.
     */
    checkBinding: async (key: string) => {
        try {
            const response = await axios.get(`${PANDAUTH_API}/keys/api/key/binding?key=${encodeURIComponent(key)}`, { headers });
            return response.data?.data;
        } catch (error: any) {
            console.error("Pandauth checkBinding Error:", error.response?.data || error.message);
            return null;
        }
    },

    /**
     * Get live service status counts.
     */
    getServiceStatus: async () => {
        try {
            const response = await axios.get(`${PANDAUTH_API}/keys/api/service/status`, { headers });
            return response.data?.data;
        } catch (error: any) {
            console.error("Pandauth getServiceStatus Error:", error.response?.data || error.message);
            return null;
        }
    }
};
