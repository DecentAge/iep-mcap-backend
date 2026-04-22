const { connectTestDb, disconnectTestDb } = require('./db-setup');
const nock = require('nock');

nock.disableNetConnect();

const main = require('../controllers/control.main');
const Currency = require('../models/model.coinmarket');

const CMC_HOST = 'https://pro-api.coinmarketcap.com';
const CMC_PATH = '/v1/cryptocurrency/listings/latest';

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

afterEach(async () => {
    await Currency.deleteMany({});
    nock.cleanAll();
});

function sampleListing(overrides = {}) {
    return {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        cmc_rank: 1,
        max_supply: 21000000,
        total_supply: 19000000,
        last_updated: '2026-01-01T00:00:00.000Z',
        quote: {
            USD: {
                price: 50000,
                volume_24h: 1000000,
                market_cap: 900000000,
                percent_change_1h: 0.1,
                percent_change_24h: 1.5,
                percent_change_7d: 10.0
            }
        },
        ...overrides
    };
}

describe('fetchCurrencies', () => {
    it('stores currencies returned from CoinMarketCap', async () => {
        nock(CMC_HOST)
            .get(CMC_PATH)
            .query(true)
            .reply(200, {
                data: [
                    sampleListing(),
                    sampleListing({
                        id: 2,
                        name: 'Ethereum',
                        symbol: 'ETH',
                        cmc_rank: 2,
                        quote: {
                            USD: {
                                price: 2500,
                                volume_24h: 500000,
                                market_cap: 300000000,
                                percent_change_1h: -0.2,
                                percent_change_24h: 0.8,
                                percent_change_7d: 5.0
                            }
                        }
                    })
                ]
            });

        await main.fetchCurrencies();

        const all = await Currency.find({}).sort({ rank: 1 });
        expect(all.length).toBe(2);

        const btc = all[0];
        expect(btc.name).toBe('Bitcoin');
        expect(btc.symbol).toBe('BTC');
        expect(btc.rank).toBe(1);
        expect(btc.price_usd).toBe(50000);
        expect(btc.price_btc).toBe(1);
        expect(btc['24h_volume_usd']).toBe(1000000);
        expect(btc.market_cap_usd).toBe(900000000);
        expect(btc.available_supply).toBe(21000000);
        expect(btc.total_supply).toBe(19000000);
        expect(btc.percent_change_24h).toBe(1.5);
        expect(typeof btc.last_updated).toBe('number');

        const eth = all[1];
        expect(eth.price_btc).toBeCloseTo(2500 / 50000);
    });

    it('upserts on subsequent calls (same id replaces)', async () => {
        nock(CMC_HOST)
            .get(CMC_PATH)
            .query(true)
            .reply(200, { data: [sampleListing()] });

        await main.fetchCurrencies();

        nock(CMC_HOST)
            .get(CMC_PATH)
            .query(true)
            .reply(200, {
                data: [sampleListing({
                    quote: { USD: { price: 60000, volume_24h: 0, market_cap: 0, percent_change_1h: 0, percent_change_24h: 0, percent_change_7d: 0 } }
                })]
            });

        await main.fetchCurrencies();

        const all = await Currency.find({});
        expect(all.length).toBe(1);
        expect(all[0].price_usd).toBe(60000);
    });

    it('rejects on empty or malformed response', async () => {
        nock(CMC_HOST)
            .get(CMC_PATH)
            .query(true)
            .reply(200, { data: [] });

        await expect(main.fetchCurrencies()).rejects.toThrow(/Invalid response/);
    });

    it('propagates HTTP errors', async () => {
        nock(CMC_HOST)
            .get(CMC_PATH)
            .query(true)
            .reply(500, 'boom');

        await expect(main.fetchCurrencies()).rejects.toThrow();
    });

    it('sends the API key header', async () => {
        const scope = nock(CMC_HOST, {
            reqheaders: {
                'X-CMC_PRO_API_KEY': v => typeof v === 'string'
            }
        })
            .get(CMC_PATH)
            .query(true)
            .reply(200, { data: [sampleListing()] });

        await main.fetchCurrencies();
        expect(scope.isDone()).toBe(true);
    });
});

describe('getCurrencies', () => {
    beforeEach(async () => {
        await Currency.create({ id: '1', name: 'Bitcoin', symbol: 'BTC', rank: 1, price_usd: 50000, percent_change_24h: 2 });
        await Currency.create({ id: '2', name: 'Ethereum', symbol: 'ETH', rank: 2, price_usd: 2500, percent_change_24h: 5 });
        await Currency.create({ id: '3', name: 'Ripple', symbol: 'XRP', rank: 3, price_usd: 0.5, percent_change_24h: -1 });
    });

    it('paginates with page/results', async () => {
        const result = await main.getCurrencies({ page: 0, results: 2, filter: 'rank', order: 'asc' });
        expect(result.length).toBe(2);
        expect(result[0].rank).toBe(1);
    });

    it('sorts desc when order is desc', async () => {
        const result = await main.getCurrencies({ page: 0, results: 10, filter: 'rank', order: 'desc' });
        expect(result[0].rank).toBe(3);
    });

    it('returns single result wrapped in array when name is provided', async () => {
        const result = await main.getCurrencies({ name: '1' });
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].name).toBe('Bitcoin');
    });
});
