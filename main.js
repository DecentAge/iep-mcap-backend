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

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
} = process.env;

const url = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

mongoose.connect(url, { connectTimeoutMS: 10000 });

mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + MONGO_HOSTNAME);
});

mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

process.on('SIGINT', async function () {
    await mongoose.connection.close();
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
});

const port = config.port;
const server = app.listen(port);

global.cronjobs = {};

const main = require('./controllers/control.main');

let fetchLock = false;

server.on('listening', function () {
    console.log('Listening on port ' + port);
    console.log('Starting internal cron for fetch..');

    cronjobs.crawl = CronJob.from({
        cronTime: '00 */55 * * * *',
        onTick: function () {
            if (!fetchLock) {
                fetchLock = true;

                console.log("=========================\nSTART FETCH CURRENCIES\n=========================");

                main.fetchCurrencies()
                    .then(() => {
                        console.log("=========================\nFETCH CURRENCIES FINISHED\n=========================");
                    })
                    .catch((error) => {
                        console.error("Error occurred during cronjob", error);
                    })
                    .finally(() => {
                        fetchLock = false;
                    });
            } else {
                console.info("Fetch is locked due to a running process - skipping this iteration");
            }
        },
        start: true,
        runOnInit: false,
    });
});

process.on('uncaughtException', function (err) {
    console.log('******* Unexpected Error *******', err);
});
