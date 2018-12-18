const crypto = require('crypto');
const ServerError = require('./lib/ServerError');
const makeRequest = require('./lib/makeRequest');
const makeSignature = require('./lib/makeSignature');
const getContentType = require('./lib/getContentType');

const { name: pkgAppId, version: pkgAppVersionId } = require('./package.json'); // pkgAppId=name, pkgAppVersionId=version

function promisify (data) {
    return new Promise ((resolve, reject) => {
        this.request(data, (err, result) => 
            err ? reject(err) : resolve(result))
    });
}

class MWSSimple {
    constructor({ appId = pkgAppId, appVersionId = pkgAppVersionId, host = 'mws.amazonservices.com', port = 443, accessKeyId, secretAccessKey, merchantId, authToken } = {}) {
        Object.assign(this, { appId, appVersionId, host, port, accessKeyId, secretAccessKey, merchantId, authToken, ServerError });
        
        // allows to use this inside the promisify method
        promisify = promisify.bind(this);
    }

    // http://docs.developer.amazonservices.com/en_US/dev_guide/DG_ClientLibraries.html
    request(requestData, callback, debugOptions) {
        // if no callback specified return a Promise
        if (callback === undefined) {
            return promisify(requestData);
        }

        const requestDefaults = {
            path: '/',
            query: {
                Timestamp: (new Date()).toISOString(),
                AWSAccessKeyId: this.accessKeyId,
                SellerId: this.merchantId,
                responseFormat: 'xml',
                MWSAuthToken: this.authToken,
            },
        };
        const newRequestData = {
            headers: {}, // requestData headers will override
            ...requestDefaults,
            ...requestData,
            query: {
                ...requestDefaults.query,
                ...requestData.query,
                SignatureMethod: 'HmacSHA256',
                SignatureVersion: '2',
            },
        };

        newRequestData.query.Signature = makeSignature({
            host: this.host,
            path: newRequestData.path,
            query: newRequestData.query,
            secretAccessKey: this.secretAccessKey,
        });

        // Use specified Content-Type or assume one
        let { 'Content-Type': contentType } = newRequestData.headers;
        if (!contentType) {
            contentType = getContentType(newRequestData.feedContent);
        }

        // queryFieldName === qs for querystring, or form for form. mws errors if you post feedContent with form.
        const queryFieldName = newRequestData.feedContent ? 'qs' : 'form';
        const options = {
            url: `https://${this.host}:${this.port}${newRequestData.path}`,
            headers: {
                Host: this.host,
                // http://docs.developer.amazonservices.com/en_US/dev_guide/DG_ClientLibraries.html (Creating the User-Agent header)
                'User-Agent': `${newRequestData.headers && newRequestData.headers['User-Agent'] || this.appId}/${this.appVersionId} (Language=Javascript)`,
                'Content-Type': contentType,
                'Content-MD5': newRequestData.feedContent ? crypto.createHash('md5').update(newRequestData.feedContent).digest('base64') : undefined,
            },
            [queryFieldName]: newRequestData.query,
            body: newRequestData.feedContent,
        };

        makeRequest(options, debugOptions, callback);
    };
}

module.exports = MWSSimple;
