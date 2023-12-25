/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define([
        './lib/OAuth.lib',
        './lib/crypto-js',
        'N/https',
        'N/log'
    ],

    (
        OAuth,
        CryptoJS,
        https,
        log
    ) => {

        const realm = ''; // Realm
        const restletUrl = '/app/site/hosting/restlet.nl?script=XXXX&deploy=1&limit=true&from=0&to=5'

        const consumerKey = ''; // Client ID
        const consumerSecret = ''; // Client Secret

        const tokenId = '';
        const tokenSecret = '';

        const nsDataCenterUrl = 'https://rest.netsuite.com/rest/datacenterurls?account=';

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const url = getRestDomain(realm) + restletUrl;

            log.debug({
                title: 'Discovered RESTlet URL',
                details: url
            })

            const token = {
                key: tokenId,
                secret: tokenSecret
            };

            const oauth = OAuth.OAuth({
                consumer: {
                    key: consumerKey,
                    secret: consumerSecret
                },
                signature_method: 'HMAC-SHA256',
                hash_function: function (base_string, key) {
                    return CryptoJS.HmacSHA256(base_string, key).toString(CryptoJS.enc.Base64);
                }
            });

            const requestData = {
                url: url,
                method: 'GET'
            };

            const headerWithRealm = oauth.toHeader(oauth.authorize(requestData, token));
            headerWithRealm.Authorization += ', realm="' + realm + '"';

            const headers = {
                'User-Agent': 'NetSuite Scheduled Script',
                'Authorization': headerWithRealm.Authorization,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            const restletResponse = https.get({
                url: url,
                headers: headers
            });

            const result = JSON.parse(restletResponse.body);

            log.debug({
                title: 'RESTlet Response',
                details: JSON.stringify(result)
            })
        }

        const getRestDomain = (realm) => {
            let result = null;
            const urls = [];

            urls[0] = nsDataCenterUrl + realm;
            urls[1] = nsDataCenterUrl + realm + '&c=' + realm;

            for(let a = 0 ; a < urls.length; a++) {
                if(result && a !== 0) break;
                result = parseRestDomain(urls[a]);
            }

            return result;
        }

        const parseRestDomain = (url) => {
            let result = null;

            try {
                result = https.get({
                    url: url,
                });

                result = JSON.parse(result.body);
                result = result.restDomain;
            } catch (e) {}

            return result;
        };

        return {execute}

    });
