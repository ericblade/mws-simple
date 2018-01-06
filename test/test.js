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
    it ('mws-simple configures default host and port correctly', (done) => {
        const mws = new MWS({});
        expect(mws).to.include.all.keys(
            'host',
            'port',
            'appId',
            'appVersionId',
        );
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
            authToken: 'authToken',
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

let keys;
try {
    keys = require('./keys.json');
} catch(err) {
}

let SkipAPITests = false;

if (!keys || !keys.accessKeyId || !keys.secretAccessKey || !keys.merchantId) {
    SkipAPITests = true;
}

describe('Requirements to perform API tests', () => {
    if ('a valid keys.json file is in the test directory', (done) => {
        expect(keys,
            'please provide a keys.json file with accessKeyId, secretAccessKey, and merchantId',
        ).to.include.all.keys(
            'accessKeyId',
            'secretAccessKey',
            'merchantId',
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
    // TODO: test response from bad API call:
    // {"ErrorResponse":{"$":{"xmlns":"https://mws.amazonservices.com/JunkTest/2011-07-01"},"Error":[{"Type":["Sender"],"Code":["InvalidAddress"],"Message":["Operation ListMarketplaces is not available for section Sellers/2011-07-01"]}],"RequestID":["736ecd92-d162-4094-9e33-4bf2d0c6bc9c"]}}
    it('test /Sellers/2011-07-01 ListMarketplaceParticipations', function test(done) {
        const query = {
            path: '/Sellers/2011-07-01',
            query: {
                Action: 'ListMarketplaceParticipations',
                Version: '2011-07-01',
            },
        };
        mwsApi.request(query, (err, result) => {
            // console.warn('* result=', JSON.stringify(result, null, 4));
            if (err) {
                done(err);
                return false;
            }
            expect(result).to.be.an('object').and.contain.key('ListMarketplaceParticipationsResponse');
            const response = result.ListMarketplaceParticipationsResponse;
            expect(response).to.be.an('object').and.contain.keys(
                '$',
                'ListMarketplaceParticipationsResult',
                'ResponseMetadata',
            );
            expect(response.$.xmlns).to.be.a('string').and.equal('https://mws.amazonservices.com/Sellers/2011-07-01');
            // TODO: we could stand to fill out the tests of received data a little more fully.
            expect(response.ListMarketplaceParticipationsResult).to.be.an('array').with.lengthOf(1);
            expect(response.ResponseMetadata).to.be.an('array').with.lengthOf(1);
            done();
        });
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
                'ResponseMetadata',
            );
            expect(response.$.xmlns).to.be.a('string').and.equal('http://mws.amazonservices.com/schema/Products/2011-10-01');
            done();
        });
    });
    // TODO: write a tester that uses a report that is guaranteed to be available, to test basic report pull functionality
});
