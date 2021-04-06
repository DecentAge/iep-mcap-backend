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
const request = require('request');
config = require('./config.js');

mongoose.Promise = global.Promise;

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB
} = process.env;

const options = {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  connectTimeoutMS: 10000,
};

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

mongoose.connect(url, options);

var express = require('express');
var app = express();

var toobusy = require('toobusy-js');
app.use(function (req, res, next) {
    if (toobusy()) {
        res.send(503, "Server is too busy right now, sorry.");
    } else {
        next();
    }
});

var port = config.port;

var router = express.Router();
app.use(router);

require('./routes/route.main.js')(router);

server = app.listen(port, '127.0.0.1');
// server = app.listen(port);

cronjobs = {};

server.on('listening', function () {
    console.log('Listening on port ' + port)
    console.log('Starting internal cron.');

    var CronJob = require('cron').CronJob;

    cronjobs.crawl = new CronJob({
        cronTime: '00 */55 * * * *',
        onTick: function () {
            console.log('Initiating fetch from cronjob..');
            request('http://localhost:8892/api/v1/fetch', function () {
            });
        },
        start: true
    });

});
