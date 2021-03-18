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
mongoose.connect(
    config.mongodb.host,
    {

        //   auth:{
        //		authdb:'admin',
        //		useMongoClient: true,
        //		user:config.mongodb.user,
        //		pass:config.mongodb.pass
        //  }

    }
);

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
