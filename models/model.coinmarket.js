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

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var Currency = new Schema({
    "id": String,
    "name": String,
    "symbol": String,
    "rank": Number,
    "price_usd": Number,
    "price_btc": Number,
    "24h_volume_usd": Number,
    "market_cap_usd": Number,
    "available_supply": Number,
    "total_supply": Number,
    "percent_change_1h": Number,
    "percent_change_24h": Number,
    "percent_change_7d": Number,
    "last_updated": Number
});

module.exports = mongoose.model('Currency', Currency);
