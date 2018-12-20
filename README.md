[![codebeat badge](https://codebeat.co/badges/8645439c-2be6-4c45-acca-aaf6ac449531)](https://codebeat.co/projects/github-com-ericblade-mws-simple-master)
# mws-simple

[![Join the chat at https://gitter.im/mws-advanced/Lobby](https://badges.gitter.im/mws-advanced/Lobby.svg)](https://gitter.im/mws-advanced/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

nodejs Amazon MWS API in (about) 150 lines of code

which means that you will have to do more work in order to make api calls but gives you the most control.  Response uses xml2js or csv-parse for conversion.

If you are looking to do something with MWS, but not involve yourself in all the raw data handling,
you may want to have a look at mws-advanced: http://www.github.com/ericblade/mws-advanced

Defaults to US marketplace settings, but can code to override default

v2,v3 branches requires node v8 or v9, tested with v8.9.4 and higher. Use v1 branch if you require
older versions of node for some reason.

## Installation

npm install mws-simple

## Usage

###### Initialize

``` javascript
let mws = require('mws-simple')({
  accessKeyId: YOUR ACCESS KEY,
  secretAccessKey: YOUR ACCESS KEY,
  merchantId: YOUR MERCHANT ID
});
```

###### Build a request object containing `query` and optionally `path`, `headers`, and `feedContent`

Of the [required parameters](http://docs.developer.amazonservices.com/en_US/dev_guide/DG_RequiredRequestParameters.html), `AWSAccessKeyId`, `SellerId`, `Signature`, `SignatureMethod`,  `SignatureVersion`, and `Timestamp` will be taken care of but most can be overridden.  This leaves `Action`, `MWSAuthToken` (for web applications and third-party developer authorizations only), and `Version` required to be populated.

Add the query parameters to `query` as needed for your specific `Action`.

If the API has an endpoint as specified in the documentation, put the endpoint in `path`.

For uploading data to MWS, populate `feedContent` with a `buffer` of data.

###### Invoke `request` with your request object
###### [Callback]

````
mws.request(requestObj, function (err, {res, headers}) {
  ....
});
````

###### [Promise]
````
mws.request(requestObj)
  .then(({result, headers}) => {
    ....
  })
  .catch(error => {
    ....
  });
````

###### Check your error, response, and headers

Note that there are two arguments that should be used for the callback:

- err: any error information returned
- result object:
  - res: the response information
  - headers: any headers returned from the call

If you receive an error, you will not likely receive anything other than undefined or null for res.
Most requests should supply headers.  Headers that a developer may be particularly interested in are
for throttling information -- per the MWS API throttling documentation,
https://docs.developer.amazonservices.com/en_UK/dev_guide/DG_Throttling.html
for functions that have Hourly Request Quotas (Products, Reports, Feeds), you will receive throttle
information in the headers: x-mws-quota-max, x-mws-quota-remaining, x-mws-quota-resetsOn
(note that it seems that either the documentation is wrong, or some layer inbetween is changing
the names to all lower-case, so x-mws-quota-resetsOn is actually x-mws-quota-resetson)

## Examples

### List Orders (open and created in last 24 hours):
``` javascript
let date = new Date();
date.setDate(date.getDate() - 1);

// create object with path and query
let listOrders = {
  path: '/Orders/2013-09-01',
  query: {
    Action: 'ListOrders',
    CreatedAfter: date.toISOString(),
    'MarketplaceId.Id.1': 'ATVPDKIKX0DER',
    'OrderStatus.Status.1': 'Unshipped',
    'OrderStatus.Status.2': 'PartiallyShipped',
    Version: '2013-09-01'
  }
}

// Callback:
mws.request(listOrders, function(e, {result, headers}) {
  console.log(JSON.stringify(headers));
  console.log(JSON.stringify(result));
});

// Promise:
mws.request(listOrders)
  .then(({result, headers}) => {
    console.log(JSON.stringify(headers));
    console.log(JSON.stringify(result));
  });
```

### Submit Shipments File:
``` javascript
let submitFeed = {
  feedContent: require('fs').readFileSync('amazon-shipments.tab'),
  path: '/Feeds/2009-01-01',
  query: {
    Action: 'SubmitFeed',
    Version: '2009-01-01',
    'MarketplaceIdList.Id.1': 'ATVPDKIKX0DER',
    FeedType: '_POST_FLAT_FILE_FULFILLMENT_DATA_'
  }
};

// Callback
mws.request(submitFeed, function(e, {result, headers}) {
});

// Promise
mws.request(submitFeed)
  .then(({result, headers}) => {
    ...
  });

```

### Handling Errors:
``` javascript
const query = {
    path: '/Test/TestErrorCall',
    query: {
        Action: 'TestForError',
        Version: '2018-02-14',
    },
};

// Callback
mws.request(query, (err, {result, headers}) => {
    if (err instanceOf(mws.ServerError)) {
      console.warn('** Server Error', err.message, err.code, err.body);
    } else if (err) {
      console.warn('** Other Error', err);
    } else {
      console.log('* Result', result);
    }
});

// Promise
mws.request(query)
  .catch(err => {
    if (err instanceof mws.ServerError) {
      console.warn('** Server Error', err.message, err.code, err.body);
    } else if (err) {
      console.warn('** Other Error', err);
    } else {
      console.log('* Result', result);
    }
  });
```

## Contributing

Yes, please!

## Contributors

Thank you!

* [ericblade](https://github.com/ericblade) Eric Blade
* [tomjnsn](https://github.com/tomjnsn) Tom Jensen
* [ebusinessdirect](https://github.com/ebusinessdirect) Original Author

## License

MIT
