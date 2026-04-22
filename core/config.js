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

module.exports = {
    port: 8892,
    defaults: {
        limit: 10
    },
    adminKey: process.env.IEP_MCAP_BACKEND_ADMIN_KEY || '**MyAdminKeyHere**',
    coinMarketCapApiKey: process.env.IEP_MCAP_BACKEND_CMC_API_KEY || '',
    coinMarketCapUrl: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=5000',
    logLevel: process.env.IEP_MCAP_BACKEND_LOGLEVEL || 'info'
};
