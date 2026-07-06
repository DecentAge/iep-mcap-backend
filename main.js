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
const { CronJob } = require('cron');
const config = require('./core/config.js');
const { app } = require('./app.js');
const main = require('./controllers/control.main');

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
} = process.env;

const url = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

mongoose.connect(url, { connectTimeoutMS: 10000 });

let xinBackfilled = false;
mongoose.connection.on('connected', function () {
    console.log('[mcap] MongoDB connected: ' + MONGO_HOSTNAME);
    // One-time at startup: backfill the XIN history (so the chart has data immediately)
    // and fetch the current XIN price (so the fiat fields aren't empty until the cron).
    if (!xinBackfilled) {
        xinBackfilled = true;
        // Chain: backfill first, then fetchXin — both write today's entry, so running
        // them concurrently could race on the unique `date` index (E11000).
        main.backfillXinHistory()
            .then((n) => {
                console.log('[mcap] XIN history backfill done — ' + n + ' new day(s) added');
                return main.fetchXin();
            })
            .then(() => console.log('[mcap] Initial XIN price fetched'))
            .catch((err) => console.error('[mcap] XIN startup fetch failed:', err.message));
    }
});

mongoose.connection.on('error', function (err) {
    console.error('[mcap] MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', function () {
    console.log('[mcap] MongoDB disconnected');
});

process.on('SIGINT', async function () {
    await mongoose.connection.close();
    console.log('[mcap] MongoDB connection closed on app termination');
    process.exit(0);
});

const port = config.port;
const server = app.listen(port);

global.cronjobs = {};

let fetchLock = false;

server.on('listening', function () {
    console.log('[mcap] Listening on port ' + port);
    console.log('[mcap] Starting fetch cron (currencies + XIN)');

    cronjobs.crawl = CronJob.from({
        cronTime: '00 */55 * * * *',
        onTick: function () {
            if (!fetchLock) {
                fetchLock = true;

                console.log('[mcap] Fetch started (currencies + XIN)');

                // Fetch CoinMarketCap currencies AND the ieUnit XIN reference price.
                // allSettled so a failure of one source does not block the other.
                Promise.allSettled([main.fetchCurrencies(), main.fetchXin()])
                    .then((results) => {
                        const labels = ['currencies', 'XIN'];
                        results.forEach((r, i) => {
                            if (r.status === 'rejected') {
                                console.error('[mcap] Fetch ' + labels[i] + ' failed:', r.reason);
                            } else {
                                console.log('[mcap] Fetch ' + labels[i] + ' ok');
                            }
                        });
                        console.log('[mcap] Fetch finished');
                    })
                    .finally(() => {
                        fetchLock = false;
                    });
            } else {
                console.warn('[mcap] Previous fetch still running — skipping this tick');
            }
        },
        start: true,
        runOnInit: false,
    });
});

process.on('uncaughtException', function (err) {
    console.error('[mcap] Uncaught exception:', err);
});
