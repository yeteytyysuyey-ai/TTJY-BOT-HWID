import { panda } from './src/panda';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    console.log('=== Pandauth API Integration Test ===\n');

    // 1. Test Service Status
    console.log('1. Fetching service status...');
    const status = await panda.getServiceStatus();
    console.log('   Status:', status ? JSON.stringify(status) : 'No data / check API key');

    // 2. Generate a Key with Discord ID and Note
    console.log('\n2. Testing key generation...');
    const testDiscordId = '123456789012345678';
    try {
        const key = await panda.generateKey({
            prefix: 'VIP',
            expirationType: 'byDays',
            expirationDays: 30,
            isPremium: true,
            noHwidValidation: false,
            discordId: testDiscordId,
            note: `Test Key (Discord: ${testDiscordId})`
        });
        console.log(`   ✅ Key generated successfully: ${key}`);

        // 3. Check Key info
        console.log('\n3. Fetching key details...');
        const keyInfo = await panda.getKey(key);
        console.log(`   Key info:`, keyInfo);

        // 4. Fetch Keys by Discord ID
        console.log('\n4. Fetching keys by Discord ID...');
        const userKeys = await panda.getKeysByDiscord(testDiscordId);
        console.log(`   Keys bound to Discord ID ${testDiscordId}:`, userKeys);

        // 5. Extend Key
        console.log('\n5. Extending key by 30 days...');
        const extendRes = await panda.extendKey(key, 30);
        console.log(`   Extend result:`, extendRes);

        // 6. Delete Test Key (clean up)
        console.log('\n6. Cleaning up test key...');
        const delRes = await panda.deleteKey(key);
        console.log(`   Delete result:`, delRes);

        console.log('\n🎉 All tests completed successfully!');
    } catch (err: any) {
        console.error('❌ Test failed with error:', err.message);
    }
}

main().catch(console.error);
