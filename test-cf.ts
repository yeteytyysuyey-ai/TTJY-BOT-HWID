import { gotScraping } from 'got-scraping';

async function test() {
    console.log("Testing TrueMoney API via got-scraping...");
    try {
        const hash = "test-hash-here";
        const twPhone = "0000000000";
        const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${twPhone}`;
        
        const response = await gotScraping.get({
            url: verifyUrl,
            headers: {
                'Accept': 'application/json, text/plain, */*'
            },
            responseType: 'json'
        });
        
        console.log("SUCCESS:", response.body);
    } catch (error: any) {
        console.log("ERROR STATUS:", error.response?.statusCode);
        console.log("ERROR BODY:", error.response?.body || error.message);
    }
}

test();
