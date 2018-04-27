const fs = require('fs');

const MWS = require('..');
const chai = require('chai');

const expect = chai.expect;

const packageInfo = require('../package.json');

describe('Sanity', () => {
    it ('true is true', (done) => {
        expect(true).to.equal(true);
        done();
    });
    it ('mws-simple returns a new mws object when called directly', (done) => {
        const mws = MWS({ accessKeyId: 'test', secretAccessKey: 'test', merchantId: 'test' });
        expect(mws).to.be.instanceOf(MWS).and.not.equal(MWS);
        done();
    });
    it ('mws-simple returns a new mws object when instantiated with new', (done) => {
        const mws = new MWS({ accessKeyId: 'test', secretAccessKey: 'test', merchantId: 'test' });
        expect(mws).to.be.instanceOf(MWS).and.not.equal(MWS);
        done();
    });
    it ('mws-simple works when called with no configuration options', (done) => {
        expect(new MWS()).to.be.instanceOf(MWS);
        done();
    });
    it ('mws-simple configures default host, port, appId, appVersionId correctly', (done) => {
        const mws = new MWS();
        expect(mws).to.include.all.keys(
            'host',
            'port',
            'appId',
            'appVersionId'
        );
        expect(mws.host).to.equal('mws.amazonservices.com');
        expect(mws.port).to.equal(443);
        expect(mws.appId).to.equal(packageInfo.name);
        expect(mws.appVersionId).to.equal(packageInfo.version);
        done();
    });
    it ('mws-simple defaults host, port, appId, appVersionId correctly when other paramaters are given', (done) => {
        const mws = new MWS({ accessKeyId: 'test', secretAccessKey: 'test', merchantId: 'test' });
        expect(mws.host).to.equal('mws.amazonservices.com');
        expect(mws.port).to.equal(443);
        expect(mws.appId).to.equal(packageInfo.name);
        expect(mws.appVersionId).to.equal(packageInfo.version);
        done();
    });
    it ('new mws object retains the keys it was constructed with', (done) => {
        const mws = new MWS({
            appId: 'testAppId',
            appVersionId: '1.0.0',
            host: 'testHost',
            port: 444,
            accessKeyId: 'accessKey',
            secretAccessKey: 'secretKey',
            merchantId: 'merchantId',
            authToken: 'authToken'
        });
        expect(mws).to.include.all.keys(
            'accessKeyId',
            'secretAccessKey',
            'merchantId',
            'authToken'
        );
        expect(mws.appId).to.equal('testAppId');
        expect(mws.appVersionId).to.equal('1.0.0');
        expect(mws.host).to.equal('testHost');
        expect(mws.port).to.equal(444);
        expect(mws.accessKeyId).to.equal('accessKey');
        expect(mws.secretAccessKey).to.equal('secretKey');
        expect(mws.merchantId).to.equal('merchantId');
        expect(mws.authToken).to.equal('authToken');
        done();
    });
    it ('new mws object does not retain keys it doesnt understand', (done) => {
        const mws = new MWS({ testData: 'test' });
        expect(mws.testData).to.be.undefined;
        done();
    });
});

let keys = {};
try {
    keys = require('./keys.json');
} catch(err) {
    keys.accessKeyId = process.env.MWS_ACCESS_KEY;
    keys.secretAccessKey = process.env.MWS_SECRET_ACCESS_KEY;
    keys.merchantId = process.env.MWS_MERCHANT_ID;
}

let SkipAPITests = false;

if (!keys || !keys.accessKeyId || !keys.secretAccessKey || !keys.merchantId) {
    SkipAPITests = true;
    console.warn('* API keys are missing, skipping live API call tests');
}

describe('Requirements to perform API tests', () => {
    if ('a valid keys.json file is in the test directory or keys available in environment', (done) => {
        expect(keys,
            'please provide a keys.json file with accessKeyId, secretAccessKey, and merchantId, or set MWS_ACCESS_KEY, MWS_SECRET_ACCESS_KEY, MWS_MERCHANT_ID in environment'
        ).to.include.all.keys(
            'accessKeyId',
            'secretAccessKey',
            'merchantId'
        );
        done();
    });
});

describe('API tests', () => {
    let mwsApi = {};
    beforeEach(function () {
        if (SkipAPITests) {
            return this.skip();
        } else {
            mwsApi = new MWS(keys);
        }
    });
    before(() => {
        try {
            fs.unlinkSync('./test-rawdata.txt');
            fs.unlinkSync('./test-parseddata.txt');
        } catch (err) {}
        expect(fs.existsSync('./test-rawdata.txt')).to.equal(false);
        expect(fs.existsSync('./test-parseddata.txt')).to.equal(false);
    });
    // TODO: test response from bad API call:
    // {"ErrorResponse":{"$":{"xmlns":"https://mws.amazonservices.com/JunkTest/2011-07-01"},"Error":[{"Type":["Sender"],"Code":["InvalidAddress"],"Message":["Operation ListMarketplaces is not available for section Sellers/2011-07-01"]}],"RequestID":["736ecd92-d162-4094-9e33-4bf2d0c6bc9c"]}}
    // TODO: test error 503 response .. how? i guess smash an API hard until it throttles? ugh.
    it('test response to junk call errors correctly', function testJunk(done) {
        const query = {
            path: '/Test/TestErrorCall',
            query: {
                Action: 'TestForError',
                Version: '2018-02-14',
            },
        };
        mwsApi.request(query, (err, result) => {
            expect(err).to.be.an.instanceOf(mwsApi.ServerError);
            expect(err.message).to.equal('Not Found');
            expect(err.code).to.equal(404);
            expect(err.body).to.be.a('string');
            done();
        });
    });
    it('test /Sellers/2011-07-01 ListMarketplaceParticipations', function test(done) {
        const query = {
            path: '/Sellers/2011-07-01',
            query: {
                Action: 'ListMarketplaceParticipations',
                Version: '2011-07-01',
            },
        };
        mwsApi.request(query, (err, result) => {
            if (err) {
                done(err);
                return false;
            }
            expect(result).to.be.an('object').and.contain.key('ListMarketplaceParticipationsResponse');
            const response = result.ListMarketplaceParticipationsResponse;
            expect(response).to.be.an('object').and.contain.keys(
                '$',
                'ListMarketplaceParticipationsResult',
                'ResponseMetadata'
            );
            expect(response.$.xmlns).to.be.a('string').and.equal('https://mws.amazonservices.com/Sellers/2011-07-01');
            // TODO: we could stand to fill out the tests of received data a little more fully.
            expect(response.ListMarketplaceParticipationsResult).to.be.an('array').with.lengthOf(1);
            expect(response.ResponseMetadata).to.be.an('array').with.lengthOf(1);
            done();
        });
    });
    it('test that debugOptions file writing works', function testFileWriting(done) {
        const query = {
            path: '/Sellers/2011-07-01',
            query: {
                Action: 'ListMarketplaceParticipations',
                Version: '2011-07-01',
            },
        };
        mwsApi.request(
            query,
            (err, result) => {
                expect(fs.existsSync('./test-rawdata.txt')).to.equal(true);
                expect(fs.existsSync('./test-parseddata.txt')).to.equal(true);
                fs.unlinkSync('./test-rawdata.txt');
                fs.unlinkSync('./test-parseddata.txt');
                done();
            },
            { rawFile: './test-rawdata.txt', parsedFile: './test-parseddata.txt'}
        );
    });
    it('test /Products/2011-10-01 GetLowestPricedOffersForASIN', function testLowestPricedOffersASIN(done) {
        const query = {
            path: '/Products/2011-10-01',
            query: {
                Action: 'GetLowestPricedOffersForASIN',
                Version: '2011-10-01',
                MarketplaceId: 'ATVPDKIKX0DER',
                ASIN: '1844161668',
                ItemCondition: 'New',
            },
        };
        mwsApi.request(query, (err, result) => {
            if (err) {
                done(err);
                return;
            }
            // Array length 0 = problem https://github.com/ericblade/mws-simple/issues/1
            expect(result).to.not.be.an('array');
            expect(result).to.be.an('object').and.contain.key('GetLowestPricedOffersForASINResponse');
            const response = result.GetLowestPricedOffersForASINResponse;
            expect(response).to.be.an('object').and.contain.keys(
                '$',
                'GetLowestPricedOffersForASINResult',
                'ResponseMetadata'
            );
            expect(response.$.xmlns).to.be.a('string').and.equal('http://mws.amazonservices.com/schema/Products/2011-10-01');
            done();
        });
    });
    it('test SubmitFeed', function testSubmitFees(done) {
        const query = {
            path: '/Feeds/2009-01-01',
            query: {
                Action: 'SubmitFeed',
                Version: '2009-01-01',
                'MarketplaceIdList.Id.1': 'ATVPDKIKX0DER',
                FeedType: '_POST_INVENTORY_AVAILABILITY_DATA_',
            },
        };
        const submitFeed = {
            feedContent: require('fs').readFileSync('./test/test-feed.txt'),
            ...query,
        };
        mwsApi.request(submitFeed, function(err, res) {
            expect(err).to.be.null;
            expect(res).to.be.an.object.with.keys(
                [ '$', 'SubmitFeedResult', 'ResponseMetaData', ],
            );
            done();
        });
    });
    it('test /Products/GetMyFeesEstimate', function testFeesEstimate(done) {
        const query = {
            path: '/Products/2011-10-01',
            query: {
                Action: 'GetMyFeesEstimate',
                Version: '2011-10-01',
                'FeesEstimateRequestList.FeesEstimateRequest.1.MarketplaceId': 'ATVPDKIKX0DER',
                'FeesEstimateRequestList.FeesEstimateRequest.1.IdType': 'ASIN',
                'FeesEstimateRequestList.FeesEstimateRequest.1.IdValue': 'B002KT3XQM',
                'FeesEstimateRequestList.FeesEstimateRequest.1.IsAmazonFulfilled': 'true',
                'FeesEstimateRequestList.FeesEstimateRequest.1.Identifier': 'request1',
                'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.CurrencyCode': 'USD',
                'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.ListingPrice.Amount': '30.00',
                'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Shipping.CurrencyCode': 'USD',
                'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Shipping.Amount': '3.99',
                'FeesEstimateRequestList.FeesEstimateRequest.1.PriceToEstimateFees.Points.PointsNumber': '0',
            },
        };
        mwsApi.request(query, (err, result) => {
            // console.warn('* err=', err);
            // console.warn('* result=', result);
            expect(result).to.be.an('object').and.contain.key('GetMyFeesEstimateResponse');
            const response = result.GetMyFeesEstimateResponse;
            expect(response).to.be.an('object').and.contain.keys(
                '$',
                'GetMyFeesEstimateResult',
                'ResponseMetadata'
            );
            done();
        });
    });
    // TODO: write a tester that uses a report that is guaranteed to be available, to test basic report pull functionality
});
