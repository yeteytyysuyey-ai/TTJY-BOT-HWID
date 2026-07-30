const TEST_KEY = 'VIP-O6VF-QXH2-C0T5-RVZI';
const PANDAUTH_API = 'https://api.pandauth.com/api/v1';
const API_KEY = process.env.PANDAUTH_API_KEY || '';
const headers = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function test(method, path, body) {
    try {
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(PANDAUTH_API + path, opts);
        const text = await res.text();
        console.log(`${method} ${path}`);
        console.log(`  ${res.status} => ${text.substring(0, 300)}\n`);
    } catch (err) {
        console.log(`${method} ${path}`);
        console.log(`  ERROR: ${err.message}\n`);
    }
}

console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING'}\n`);

await test('GET', `/keys/api/generated-key?key=${TEST_KEY}`);
await test('DELETE', `/keys/api/key?key=${TEST_KEY}`);
await test('DELETE', `/keys/api/generated-key?key=${TEST_KEY}`);
await test('POST', `/keys/api/delete`, { key: TEST_KEY });
await test('POST', `/keys/api/remove`, { key: TEST_KEY });
await test('PATCH', `/keys/api/key`, { key: TEST_KEY, expirationDays: 30, expirationType: 'byDays' });
await test('PUT', `/keys/api/key`, { key: TEST_KEY, expirationDays: 30, expirationType: 'byDays' });
await test('POST', `/keys/api/update`, { key: TEST_KEY, expirationDays: 30 });
await test('PATCH', `/keys/api/generated-key`, { key: TEST_KEY, expirationDays: 30 });
