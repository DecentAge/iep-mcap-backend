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

const request = require('request');
const requestPromise = require('request-promise');
const currency = require('../models/model.coinmarket');
const async = require('async');
config = require('../config.js');

const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=5000';

String.prototype.isJson = function () {
    try {
        JSON.parse(this);
    } catch (e) {
        return false;
    }
    return true;
};

module.exports = {

    fetchCurrencies: function (cb) {

        requestPromise({
            uri: url,
            headers: {
                'X-CMC_PRO_API_KEY': config.apiKey
            },
            json: true
        })
            .then(function (response) {
                let data = response.data;
                let btcConversionRate = 1 / data[0].quote.USD.price;

                async.each(data, function (obj, cb) {
                    let insertObject = {
                        "id": obj.id,
                        "name": obj.name,
                        "symbol": obj.symbol,
                        "rank": obj.cmc_rank,
                        "price_usd": obj.quote.USD.price,
                        "price_btc": btcConversionRate * obj.quote.USD.price,
                        "24h_volume_usd": obj.quote.USD.volume_24h,
                        "market_cap_usd": obj.quote.USD.market_cap,
                        "available_supply": obj.max_supply,
                        "total_supply": obj.total_supply,
                        "percent_change_1h": obj.quote.USD.percent_change_1h,
                        "percent_change_24h": obj.quote.USD.percent_change_24h,
                        "percent_change_7d": obj.quote.USD.percent_change_7d,
                        "last_updated": new Date(obj.last_updated).getTime()
                    };

                    currency.findOneAndUpdate({ id: insertObject.id }, insertObject, { upsert: true }, function (err) {

                        if (err) {
                            console.log(err);
                            cb(err);
                        } else {
                            cb();
                        }

                    });
                }, function (err) {

                    if (err) {
                        console.log('Error inserting into DB');
                        cb('Error inserting into DB');
                    } else {
                        cb(null);
                    }

                });
            })
            .catch(function (err) {
                console.log('Invalid response format from CoinMarket');
                cb('Invalid response format from CoinMarket');
            });
    },

    getCurrencies: function (params, cb) {

        var skip = params.page * params.results;

        var sort = {};
        sort[params.filter] = 1;
        if (params.order == 'desc')
            sort[params.filter] = -1;

        if (params.name) {

            params.name = params.name.toLowerCase();

            currency.findOne({ id: params.name }, function (err, data) {
                var result = [data];
                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    cb(null, result);
                }
            });

        } else {
            currency.find({}, {}, { skip: skip, limit: parseInt(params.results), sort: sort }, function (err, data) {

                if (err) {
                    console.log(err);
                    cb(err);
                } else {
                    cb(null, data);
                }

            })
        }

    }

};
