import { IncomingHttpHeaders } from 'http';
import crypto from 'crypto';
import ServerError from './ServerError';
// eslint-disable-next-line import/no-cycle
import makeRequest from './makeRequest';
import makeSignature from './makeSignature';
import getContentType from './getContentType';

const { name: pkgAppId, version: pkgAppVersionId } = require('../package.json');

export interface ConstructorParams {
    appId?: string,
    appVersionId?: string,
    host?: string,
    port?: number,
    accessKeyId?: string,
    secretAccessKey?: string,
    merchantId?: string,
    authToken?: string,
}

export interface DebugOptions {
    rawFile?: string,
    parsedFile?: string,
}

class MWSSimple {
    readonly accessKeyId: string = '';

    readonly appId: string = '';

    readonly appVersionId: string = '';

    readonly merchantId: string = '';

    readonly authToken: string = '';

    readonly host: string = '';

    readonly port: number = 443;

    readonly secretAccessKey: string = '';

    constructor({
        appId = pkgAppId,
        appVersionId = pkgAppVersionId,
        host = 'mws.amazonservices.com',
        port = 443,
        accessKeyId,
        secretAccessKey,
        merchantId,
        authToken,
    }: ConstructorParams = {}) {
        Object.assign(this, {
            appId,
            appVersionId,
            host,
            port,
            accessKeyId,
            secretAccessKey,
            merchantId,
            authToken,
            ServerError,
        });

        // allows to use this inside the request method
        this.request = this.request.bind(this);
    }

    // http://docs.developer.amazonservices.com/en_US/dev_guide/DG_ClientLibraries.html
    request(
        requestData: any, // TODO: this should NOT be any.
        // TODO: how can i put this messy callback line into a .d.ts and import it, so both this
        // and makeRequest can use it?
        callback?: (
            err: Error | null,
            results: { result?: any, headers: IncomingHttpHeaders }
        ) => void,
        debugOptions?: DebugOptions,
    ) : Promise<any> | void {
        const self = this.request;

        // if no callback specified return a Promise
        if (callback === undefined) {
            return new Promise(
                (resolve, reject) => self(
                    requestData, (err: Error | null, result: any) => (err ? reject(err) : resolve(result)),
                ),
            );
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

        // queryFieldName === qs for querystring, or form for form. mws errors if you post
        // feedContent with form.
        const queryFieldName = newRequestData.feedContent ? 'qs' : 'form';
        const options = {
            url: `https://${this.host}:${this.port}${newRequestData.path}`,
            headers: {
                Host: this.host,
                // http://docs.developer.amazonservices.com/en_US/dev_guide/DG_ClientLibraries.html (Creating the User-Agent header)
                'User-Agent': `${(newRequestData.headers && newRequestData.headers['User-Agent']) || this.appId}/${this.appVersionId} (Language=Javascript)`,
                'Content-Type': contentType,
                'Content-MD5': newRequestData.feedContent ? crypto.createHash('md5').update(newRequestData.feedContent).digest('base64') : undefined,
            },
            [queryFieldName]: newRequestData.query,
            body: newRequestData.feedContent,
        };

        return makeRequest(options, debugOptions, callback);
    }
}

export { MWSSimple };
export default MWSSimple;
