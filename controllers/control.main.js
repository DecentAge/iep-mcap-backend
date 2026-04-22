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
