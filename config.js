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
    mongodb: {
        user: "apiUser",
        pass: "**MyPasswordHere**",
        host: "mongodb://localhost/macap"
    },
    defaults: {
        //paging limit
        limit: 10
    },
    adminkey: '**MyAdminKeyHere**',
    apiKey: '6bf9e35a-241d-49a4-82f5-c4a9cafb29d2'
};
