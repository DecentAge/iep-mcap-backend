// Live smoke test against the real CoinMarketCap Pro API.
//
// Skipped by default. To run:
//   CMC_API_KEY_LIVE=<your-key> ./run-tests.sh tests/cmc-live.test.js
//
// Verifies the endpoint still exists and returns the response shape that
// control.main.fetchCurrencies depends on. Does NOT touch MongoDB.

const axios = require('axios');
const config = require('../core/config');

const liveKey = process.env.CMC_API_KEY_LIVE;
const runLive = Boolean(liveKey);

(runLive ? describe : describe.skip)('CoinMarketCap live endpoint', () => {
    it('returns the documented shape fetchCurrencies depends on', async () => {
        const response = await axios.get(config.coinMarketCapUrl, {
            headers: { 'X-CMC_PRO_API_KEY': liveKey },
            timeout: 30_000,
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.data)).toBe(true);
        expect(response.data.data.length).toBeGreaterThan(0);

        const sample = response.data.data[0];
        expect(typeof sample.id).toBe('number');
        expect(typeof sample.name).toBe('string');
        expect(typeof sample.symbol).toBe('string');
        expect(typeof sample.cmc_rank).toBe('number');
        expect(typeof sample.last_updated).toBe('string');
        expect(Number.isFinite(new Date(sample.last_updated).getTime())).toBe(true);

        const usd = sample.quote && sample.quote.USD;
        expect(usd).toBeDefined();
        expect(typeof usd.price).toBe('number');
        expect(typeof usd.volume_24h).toBe('number');
        expect(typeof usd.market_cap).toBe('number');
        expect(typeof usd.percent_change_1h).toBe('number');
        expect(typeof usd.percent_change_24h).toBe('number');
        expect(typeof usd.percent_change_7d).toBe('number');
    }, 60_000);
});
