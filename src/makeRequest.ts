import request, {
    CoreOptions,
    Response,
    UriOptions,
    UrlOptions,
} from 'request';
import { IncomingHttpHeaders } from 'http';
// eslint-disable-next-line import/no-cycle
import { DebugOptions } from './mws-simple';

import syncWriteToFile from './syncWriteToFile';
import ServerError from './ServerError';
// eslint-disable-next-line import/no-named-as-default
import processRequest from './processRequest';

/* eslint-disable prefer-arrow-callback, consistent-return, max-len, no-console */
export default (
    options: (CoreOptions & UriOptions) | (CoreOptions & UrlOptions),
    debug: DebugOptions = {},
    cb: (err: Error | null, results: { result?: any, headers: IncomingHttpHeaders }) => void,
) => {
    request.post(options, function postRequest(error: Error | null, response: Response, body: string) {
        function logDataDoCallback(err: Error | null, result: any, file: string, data: string) {
            if (file) {
                syncWriteToFile(file, data);
            }
            cb(err, { result, headers: response.headers });
        }

        if (debug.rawFile) {
            syncWriteToFile(debug.rawFile, `\nerror= ${error}\nresponse= ${JSON.stringify(response)}\nbody= ${body}\n`);
        }

        if (error) {
            return cb(error instanceof Error ? error : new Error(error), { result: null, headers: response && response.headers });
        }
        if (response.statusCode < 200 || response.statusCode > 299) {
            return cb(new ServerError(response.statusMessage, response.statusCode, response.body), { result: null, headers: response && response.headers });
        }

        const contentType = Object.prototype.hasOwnProperty.call(response.headers, 'content-type') && response.headers['content-type'];
        processRequest({ contentType, body }, (err: Error | null, result: any) => (
            logDataDoCallback(err, result, debug.parsedFile, `\nerror=${err}\nresult=${JSON.stringify(result)}\n`)
        ));
    });
};
