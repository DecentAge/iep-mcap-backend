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

const fn = require('../controllers/control.main');
const config = require('../core/config.js');
const pjson = require('../package.json');

module.exports = function (router) {

    router.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    router.route('/api/version')
        .get(function (req, res) {
            res.send(pjson.version);
        });

    router.route('/api/v1/fetch')
        .get(async function (req, res) {
            if (!req.query.key || req.query.key !== config.adminKey) {
                return res.status(400).send({ code: 400, success: false, message: 'Invalid or missing key.' });
            }

            try {
                await fn.fetchCurrencies();
                res.status(200).send({ code: 200, success: true, message: 'Currencies fetched from CoinMarket.' });
            } catch (err) {
                console.error(err);
                res.status(500).send({ code: 500, success: false, message: 'An error has occurred.' });
            }
        });

    router.route('/api/v1/fetch/deactivate')
        .get(function (req, res) {
            if (!req.query.key || req.query.key !== config.adminKey) {
                return res.status(400).send({ code: 400, success: false, message: 'Invalid or missing key.' });
            }

            cronjobs.crawl.stop();

            res.status(200).send({ code: 200, success: true, message: 'Internal cron for crawl deactivated.' });
        });

    router.route('/api/v1/fetch/activate')
        .get(function (req, res) {
            if (!req.query.key || req.query.key !== config.adminKey) {
                return res.status(400).send({ code: 400, success: false, message: 'Invalid or missing key.' });
            }

            cronjobs.crawl.stop();
            cronjobs.crawl.start();

            res.status(200).send({ code: 200, success: true, message: 'Internal cron for crawl activated.' });
        });

    router.route('/api/v1/get')
        .get(async function (req, res) {
            try {
                const page = req.query.page ? Number(req.query.page) - 1 : 0;
                const results = req.query.results ? Number(req.query.results) : config.defaults.limit;

                let filter = req.query.filter || 'rank';
                let order = req.query.order || 'asc';

                if (filter === '24h') {
                    filter = 'percent_change_24h';
                    order = 'desc';
                }
                if (filter === '7d') {
                    filter = 'percent_change_7d';
                    order = 'desc';
                }

                const params = {
                    page,
                    results,
                    filter,
                    order,
                    name: req.query.name
                };

                const data = await fn.getCurrencies(params);
                res.type('json');
                res.send(data);
            } catch (err) {
                console.error(err);
                res.status(500).send({ code: 500, success: false, message: 'An error has occurred.' });
            }
        });
};
