"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pandauth = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
// Polyfill WebSocket for Node < 22 to prevent Supabase RealtimeClient crashes
if (!globalThis.WebSocket) {
    globalThis.WebSocket = ws_1.default;
}
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use SERVICE_ROLE_KEY for admin access if available, otherwise fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let client = null;
if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing from the environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}
else {
    const isUsingServiceRole = supabaseKey.includes('service_role');
    console.log(`[Supabase] Initializing client... Using Service Role Key? ${isUsingServiceRole}`);
    client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
exports.supabase = client;
// Placeholder for Pandauth.com integration
exports.pandauth = {
    // Add pandauth methods here later
    validateVoucher: async (voucher) => {
        console.log(`[Pandauth Placeholder] Validating voucher: ${voucher}`);
        return true;
    }
};
