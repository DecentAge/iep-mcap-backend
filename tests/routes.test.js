const request = require('supertest');
const { connectTestDb, disconnectTestDb } = require('./db-setup');

const { app } = require('../app');
const Currency = require('../models/model.coinmarket');

beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

afterEach(async () => {
    await Currency.deleteMany({});
});

describe('GET /api/version', () => {
    it('returns the package version', async () => {
        const res = await request(app).get('/api/version');
        expect(res.status).toBe(200);
        expect(res.text).toBe(require('../package.json').version);
    });
});

describe('GET /api/v1/get', () => {
    it('returns empty array when no currencies exist', async () => {
        const res = await request(app).get('/api/v1/get');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('returns seeded currencies sorted by rank ascending by default', async () => {
        await Currency.create({ id: '1', name: 'Bitcoin', symbol: 'BTC', rank: 1, price_usd: 50000 });
        await Currency.create({ id: '2', name: 'Ethereum', symbol: 'ETH', rank: 2, price_usd: 3000 });
        await Currency.create({ id: '3', name: 'Ripple', symbol: 'XRP', rank: 3, price_usd: 0.5 });

        const res = await request(app).get('/api/v1/get');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);
        expect(res.body[0].rank).toBe(1);
        expect(res.body[2].rank).toBe(3);
    });

    it('respects the results limit parameter', async () => {
        for (let i = 1; i <= 5; i++) {
            await Currency.create({ id: String(i), name: `Coin${i}`, symbol: `C${i}`, rank: i });
        }
        const res = await request(app).get('/api/v1/get?results=2&page=1');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].rank).toBe(1);
    });

    it('returns second page when page=2', async () => {
        for (let i = 1; i <= 5; i++) {
            await Currency.create({ id: String(i), name: `Coin${i}`, symbol: `C${i}`, rank: i });
        }
        const res = await request(app).get('/api/v1/get?results=2&page=2');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].rank).toBe(3);
    });

    it('finds a currency by name (id lookup)', async () => {
        await Currency.create({ id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', rank: 1 });
        const res = await request(app).get('/api/v1/get?name=Bitcoin');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].name).toBe('Bitcoin');
    });

    it('24h filter sorts by percent_change_24h desc', async () => {
        await Currency.create({ id: '1', rank: 1, percent_change_24h: 5 });
        await Currency.create({ id: '2', rank: 2, percent_change_24h: 20 });
        await Currency.create({ id: '3', rank: 3, percent_change_24h: -3 });

        const res = await request(app).get('/api/v1/get?filter=24h');
        expect(res.status).toBe(200);
        expect(res.body[0].percent_change_24h).toBe(20);
        expect(res.body[2].percent_change_24h).toBe(-3);
    });

    it('7d filter sorts by percent_change_7d desc', async () => {
        await Currency.create({ id: '1', rank: 1, percent_change_7d: 5 });
        await Currency.create({ id: '2', rank: 2, percent_change_7d: 30 });

        const res = await request(app).get('/api/v1/get?filter=7d');
        expect(res.status).toBe(200);
        expect(res.body[0].percent_change_7d).toBe(30);
    });

    it('order=desc reverses default sort', async () => {
        await Currency.create({ id: '1', rank: 1 });
        await Currency.create({ id: '2', rank: 2 });

        const res = await request(app).get('/api/v1/get?order=desc');
        expect(res.status).toBe(200);
        expect(res.body[0].rank).toBe(2);
    });
});

describe('admin endpoints', () => {
    const originalAdminKey = require('../core/config').adminKey;

    it('rejects /api/v1/fetch without key', async () => {
        const res = await request(app).get('/api/v1/fetch');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('rejects /api/v1/fetch with wrong key', async () => {
        const res = await request(app).get('/api/v1/fetch?key=wrong');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('rejects /api/v1/fetch/deactivate without key', async () => {
        const res = await request(app).get('/api/v1/fetch/deactivate');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('rejects /api/v1/fetch/activate without key', async () => {
        const res = await request(app).get('/api/v1/fetch/activate');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
