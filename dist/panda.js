"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.panda = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const PANDAUTH_API = 'https://api.pandauth.com/api/v1';
const API_KEY = process.env.PANDAUTH_API_KEY;
if (!API_KEY) {
    console.warn("PANDAUTH_API_KEY is not defined in environment variables.");
}
const headers = {
    'X-API-Key': API_KEY || '',
    'Content-Type': 'application/json'
};
exports.panda = {
    /**
     * Generate one or more keys and optionally bind Discord ID and Note to them.
     */
    generateKey: async (options = {}) => {
        try {
            const expType = options.expirationType || 'byDays';
            const payload = {
                count: options.count || 1,
                prefix: options.prefix || 'VIP',
                expirationType: expType,
                isPremium: options.isPremium !== undefined ? options.isPremium : true,
                noHwidValidation: options.noHwidValidation !== undefined ? options.noHwidValidation : true
            };
            if (expType === 'byDays') {
                payload.expirationDays = options.expirationDays !== undefined ? options.expirationDays : 30;
            }
            else if (expType === 'byDate' && options.expiresAt) {
                payload.expiresAt = options.expiresAt;
            }
            if (options.note) {
                payload.note = options.note;
            }
            const response = await axios_1.default.post(`${PANDAUTH_API}/keys/api/generate`, payload, { headers });
            const generatedKeys = response.data?.data?.keys;
            if (generatedKeys && generatedKeys.length > 0) {
                const keyValue = generatedKeys[0].value;
                // If discordId or note was provided, bind to generated key via PUT /keys/api/generated-key
                if (options.discordId || options.note) {
                    try {
                        await exports.panda.editGeneratedKey(keyValue, {
                            discordId: options.discordId,
                            note: options.note
                        });
                    }
                    catch (bindErr) {
                        console.warn("Failed to bind discordId/note to generated key in Pandauth:", bindErr.message);
                    }
                }
                return keyValue;
            }
            else {
                throw new Error("API responded but no keys were generated.");
            }
        }
        catch (error) {
            console.error("Pandauth Generate Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to generate key from Pandauth");
        }
    },
    /**
     * Edit a generated (unredeemed) key.
     */
    editGeneratedKey: async (key, data) => {
        try {
            const response = await axios_1.default.put(`${PANDAUTH_API}/keys/api/generated-key`, { key, ...data }, { headers });
            return response.data;
        }
        catch (error) {
            console.error("Pandauth Edit Generated Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to edit generated key");
        }
    },
    /**
     * Edit an active (redeemed) key.
     */
    editActiveKey: async (key, data) => {
        try {
            const response = await axios_1.default.put(`${PANDAUTH_API}/keys/api/key`, { key, ...data }, { headers });
            return response.data;
        }
        catch (error) {
            console.error("Pandauth Edit Active Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to edit active key");
        }
    },
    /**
     * Extend a key's expiration by a given number of days.
     * Works for active keys (via extend-expiration) and generated keys (via editGeneratedKey).
     */
    extendKey: async (key, days = 30) => {
        try {
            const keyInfo = await exports.panda.getKey(key);
            if (!keyInfo) {
                throw new Error("Key not found in Pandauth. It may have been deleted.");
            }
            if (keyInfo.isActive) {
                // Active key extension
                const response = await axios_1.default.post(`${PANDAUTH_API}/keys/api/key/extend-expiration`, { key, days }, { headers });
                return response.data;
            }
            else {
                // Generated / unused key extension
                const currentExpiresAt = keyInfo.data?.expiresAt ? new Date(keyInfo.data.expiresAt) : new Date();
                const newExpiresAt = new Date(currentExpiresAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
                return await exports.panda.editGeneratedKey(key, {
                    expiresAt: newExpiresAt
                });
            }
        }
        catch (error) {
            console.error("Pandauth Extend Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to extend key");
        }
    },
    /**
     * Fetch key info (searches active and generated keys).
     */
    getKey: async (key) => {
        try {
            // 1. Try active key first
            try {
                const activeRes = await axios_1.default.get(`${PANDAUTH_API}/keys/api/key?key=${encodeURIComponent(key)}`, { headers });
                if (activeRes.data?.data) {
                    const keyData = activeRes.data.data.key || activeRes.data.data;
                    return { data: keyData, isActive: true };
                }
            }
            catch (err) {
                // Ignore 404/400
            }
            // 2. Try generated (unused) key
            try {
                const genRes = await axios_1.default.get(`${PANDAUTH_API}/keys/api/generated-key?key=${encodeURIComponent(key)}`, { headers });
                if (genRes.data?.data) {
                    const keyData = genRes.data.data.key || genRes.data.data;
                    return { data: keyData, isActive: false };
                }
            }
            catch (err) {
                // Ignore 404/400
            }
            return null;
        }
        catch (error) {
            console.error("Pandauth API Error in getKey:", error.response?.data || error.message);
            return null;
        }
    },
    /**
     * Fetch every key bound to a Discord user (searches both generated and active keys).
     */
    getKeysByDiscord: async (discordId, includeLoadstring = true) => {
        try {
            const url = `${PANDAUTH_API}/keys/api/key/by-discord?discordId=${encodeURIComponent(discordId)}${includeLoadstring ? '&includeLoadstring=1' : ''}`;
            const response = await axios_1.default.get(url, { headers });
            return response.data?.data || [];
        }
        catch (error) {
            console.error("Pandauth getKeysByDiscord Error:", error.response?.data || error.message);
            return [];
        }
    },
    /**
     * Delete a key (attempts deletion from active keys, then generated keys).
     */
    deleteKey: async (key) => {
        try {
            // Try active key
            try {
                const res = await axios_1.default.delete(`${PANDAUTH_API}/keys/api/key?key=${encodeURIComponent(key)}`, { headers });
                if (res.data?.success)
                    return res.data;
            }
            catch (e) {
                // continue
            }
            // Try generated key
            const resGen = await axios_1.default.delete(`${PANDAUTH_API}/keys/api/generated-key?key=${encodeURIComponent(key)}`, { headers });
            return resGen.data;
        }
        catch (error) {
            console.error("Pandauth Delete Key Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to delete key");
        }
    },
    /**
     * Reset HWID for a key (unbinds HWID).
     */
    resetHwid: async (key) => {
        try {
            const endpoints = [
                { url: `${PANDAUTH_API}/keys/reset-hwid`, method: 'POST', body: { key } },
                { url: `${PANDAUTH_API}/keys/api/key/reset-hwid`, method: 'POST', body: { key } },
                { url: `${PANDAUTH_API}/keys/api/key`, method: 'PUT', body: { key, hwid: null, noHwidValidation: true } },
                { url: `${PANDAUTH_API}/keys/api/generated-key`, method: 'PUT', body: { key, hwid: null, noHwidValidation: true } }
            ];
            for (const ep of endpoints) {
                try {
                    const res = await (0, axios_1.default)({
                        method: ep.method,
                        url: ep.url,
                        data: ep.body,
                        headers
                    });
                    if (res.data)
                        return res.data;
                }
                catch (e) {
                    // Continue to next endpoint
                }
            }
            return { success: true };
        }
        catch (error) {
            console.error("Pandauth Reset HWID Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to reset HWID");
        }
    },
    /**
     * Check key binding status.
     */
    checkBinding: async (key) => {
        try {
            const response = await axios_1.default.get(`${PANDAUTH_API}/keys/api/key/binding?key=${encodeURIComponent(key)}`, { headers });
            return response.data?.data;
        }
        catch (error) {
            console.error("Pandauth checkBinding Error:", error.response?.data || error.message);
            return null;
        }
    },
    /**
     * Get live service status counts.
     */
    getServiceStatus: async () => {
        try {
            const response = await axios_1.default.get(`${PANDAUTH_API}/keys/api/service/status`, { headers });
            return response.data?.data;
        }
        catch (error) {
            console.error("Pandauth getServiceStatus Error:", error.response?.data || error.message);
            return null;
        }
    }
};
