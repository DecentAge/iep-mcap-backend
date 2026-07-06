/******************************************************************************
 * Copyright © 2017 XIN Community                                             *
 *                                                                            *
 * See the DEVELOPER-AGREEMENT.txt and LICENSE.txt files at the top-level     *
 * directory of this distribution for the individual copyright  holder        *
 * information and the developer policies on copyright and licensing.         *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * XIN software, including this file, may be copied, modified, propagated,    *
 * or distributed except according to the terms contained in the LICENSE.txt  *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

const axios = require('axios');
const Currency = require('../models/model.coinmarket');
const XinPrice = require('../models/model.xin-price');
const config = require('../core/config.js');

exports.fetchCurrencies = async function () {
    const response = await axios.get(config.coinMarketCapUrl, {
        headers: { 'X-CMC_PRO_API_KEY': config.coinMarketCapApiKey },
        timeout: 30000
    });

    const data = response.data && response.data.data;
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format from CoinMarket');
    }

    const btcConversionRate = 1 / data[0].quote.USD.price;

    await Promise.all(data.map(function (obj) {
        const insertObject = {
            id: obj.id,
            name: obj.name,
            symbol: obj.symbol,
            rank: obj.cmc_rank,
            price_usd: obj.quote.USD.price,
            price_btc: btcConversionRate * obj.quote.USD.price,
            '24h_volume_usd': obj.quote.USD.volume_24h,
            market_cap_usd: obj.quote.USD.market_cap,
            available_supply: obj.max_supply,
            total_supply: obj.total_supply,
            percent_change_1h: obj.quote.USD.percent_change_1h,
            percent_change_24h: obj.quote.USD.percent_change_24h,
            percent_change_7d: obj.quote.USD.percent_change_7d,
            last_updated: new Date(obj.last_updated).getTime()
        };

        return Currency.findOneAndUpdate({ id: insertObject.id }, insertObject, { upsert: true });
    }));
};

exports.getCurrencies = async function (params) {
    if (params.name) {
        const name = String(params.name).toLowerCase();
        const doc = await Currency.findOne({ id: name });
        return [doc];
    }

    const sort = {};
    sort[params.filter] = params.order === 'desc' ? -1 : 1;
    const skip = params.page * params.results;

    return Currency.find({})
        .sort(sort)
        .skip(skip)
        .limit(parseInt(params.results, 10));
};

// XIN is not on CoinMarketCap; its USD reference comes from the ieUnit API
// (special.XIN.usd). Store it as a daily time-series (one entry per day) so a real
// XIN price history builds up, and mirror the current value into the Currency
// collection so XIN also appears in /api/v1/get.
exports.fetchXin = async function () {
    const response = await axios.get(config.ieUnitRatesUrl, { timeout: 30000 });
    const xin = response.data && response.data.special && response.data.special.XIN;
    if (!xin || xin.usd == null) {
        throw new Error('No XIN entry in ieUnit response');
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const SATOSHI = 1e-8;                          // 1 XIN = 1 Satoshi
    const priceUsd = xin.usd;

    await XinPrice.findOneAndUpdate(
        { date },
        { date, timestamp: now.getTime(), price_usd: priceUsd, price_btc: SATOSHI, source: 'ieUnit' },
        { upsert: true }
    );

    await Currency.findOneAndUpdate(
        { id: 'xin' },
        {
            id: 'xin',
            name: 'XIN (Infinity Economics)',
            symbol: 'XIN',
            price_usd: priceUsd,
            price_btc: SATOSHI,
            last_updated: now.getTime()
        },
        { upsert: true }
    );
};

// XIN daily price history (oldest -> newest). Optional { days } limits the range.
exports.getXinHistory = async function (params) {
    const query = XinPrice.find({}, { _id: 0, __v: 0 }).sort({ timestamp: 1 });
    if (params && params.days) {
        const since = Date.now() - Number(params.days) * 24 * 60 * 60 * 1000;
        query.where('timestamp').gte(since);
    }
    return query;
};

// One-time, idempotent backfill of the XIN daily history from CoinGecko daily BTC/USD
// closes x the 1-Satoshi peg, so the chart has history immediately. `$setOnInsert`
// ensures real ieUnit-sourced days are never overwritten.
exports.backfillXinHistory = async function (days) {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
        params: { vs_currency: 'usd', days: days || 365 }, // > 90 days -> CoinGecko returns daily
        timeout: 30000
    });

    const prices = response.data && response.data.prices;
    if (!Array.isArray(prices) || prices.length === 0) {
        throw new Error('Invalid response from CoinGecko for XIN backfill');
    }

    const SATOSHI = 1e-8;
    let inserted = 0;
    await Promise.all(prices.map(function (p) {
        const ts = p[0];
        const date = new Date(ts).toISOString().slice(0, 10);
        return XinPrice.updateOne(
            { date },
            { $setOnInsert: { date, timestamp: ts, price_usd: p[1] * SATOSHI, price_btc: SATOSHI, source: 'coingecko-backfill' } },
            { upsert: true }
        ).then(function (r) { inserted += (r.upsertedCount || 0); });
    }));

    return inserted;
};
