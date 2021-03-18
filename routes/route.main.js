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

var fn = require('../controllers/control.main');

function cliAddress(req) {

    var ip = (req.headers["X-Forwarded-For"] ||
        req.headers["x-forwarded-for"] ||
        '').split(',')[0] ||
        req.client.remoteAddress;

    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
    }

    return ip.trim();
}

function isLocal(req) {
    return server.address().address == cliAddress(req);
}

module.exports = function (router) {

    router.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    router.route('/api/v1/fetch')
        .get(function (req, res) {

            if (!isLocal(req))
                return res.send({ code: 400, success: false, message: 'This endpoint is not remotely accessible.' });

            console.log('Fetching...');

            fn.fetchCurrencies(function (err) {

                if (err) {
                    console.log(err);
                    res.status(500);
                    res.send({ code: 500, success: false, message: err });
                } else {
                    res.status(200);
                    res.send({ code: 200, success: true, message: 'Currencies fetched from CoinMarket.' });
                }

            })

        });

    //Activation and deactivation endpoints
    router.route('/api/v1/fetch/deactivate')
        .get(function (req, res) {

            console.log(req.query.key);

            if (!req.query.key || req.query.key != config.adminKey)
                return res.send({ code: 400, success: false, message: 'Invalid or missing key.' });

            cronjobs.crawl.stop();

            res.status(200);
            res.send({ code: 200, success: true, message: 'Internal cron for crawl deactivated.' });

        });

    router.route('/api/v1/fetch/activate')
        .get(function (req, res) {

            console.log(req.query.key);

            if (!req.query.key || req.query.key != config.adminKey)
                return res.send({ code: 400, success: false, message: 'Invalid or missing key.' });

            cronjobs.crawl.stop();
            cronjobs.crawl.start();

            res.status(200);
            res.send({ code: 200, success: true, message: 'Internal cron for crawl activated.' });

        });

    router.route('/api/v1/get')
        .get(function (req, res) {

            var page = req.query.page;
            var results = req.query.results;
            var filter = req.query.filter;
            var order = req.query.order;

            var name = req.query.name;

            page = page ? page - 1 : 0;

            results = results ? results : config.defaults.limit;

            filter = filter ? filter : 'rank';

            order = order ? order : 'asc';

            if (filter == '24h') {
                filter = 'percent_change_24h';
                order = 'desc';
            }
            if (filter == '7d') {
                filter = 'percent_change_7d';
                order = 'desc';
            }

            var params = {
                page: page,
                results: results,
                filter: filter,
                order: order,
                name: name
            };

            fn.getCurrencies(params, function (err, data) {

                if (err) {
                    console.log(err);
                    res.status(500);
                    res.send({ code: 500, success: false, message: err });
                } else {
                    res.type('json');
                    res.send(data);
                }

            })

        });

};
