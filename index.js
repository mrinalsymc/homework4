/**
 * The tart of the server handling
 *
 */

var http = require('http');
var https = require('https');
var url = require('url');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
var fs = require('fs');
var path = require('path');
var config = require('./lib/config');
var StringDecoder = require('string_decoder').StringDecoder;
const util = require('util');
var debug = util.debuglog('index');

unifiedServerHandling = (req, res) => {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var method = req.method.toLowerCase();
    var queryStringObj = parsedUrl.query;
    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = ''
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();

        var data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObj': queryStringObj,
            'headers': headers,
            'payload': helpers.parseJsonStringToObject(buffer)
        }

        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath]: handlers.notFound;

        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public: chosenHandler;
        
        chosenHandler(data).then((success) => {
            //determine the type of response (fallback to json)
            var contentType = typeof(success.contentType) === 'string'? success.contentType: 'json'; 
            var status = typeof(success.status) === 'number'? success.status: 200;
            var payload = success.payload;
            debug('\x1b[32m%s\x1b[0m','success : ',success, trimmedPath);

            var payloadString = '';
            if (contentType === 'json') {
                debug('json handling');
                res.setHeader('Content-type', 'application/json');
                payload = typeof(payload) === 'object'? payload: {};
                payloadString = JSON.stringify(payload)
            }
            if (contentType === 'html') {
                debug('html handling');
                res.setHeader('Content-type', 'text/html');
                payloadString = typeof(payload) === 'string'? payload: '';
            }

            if (contentType === 'favicon') {
                debug('icon handling');
                res.setHeader('Content-type', 'image/x-icon');
                payloadString = typeof(payload) !== undefined? payload: '';
            }
            if (contentType === 'css') {
                debug('icon handling');
                res.setHeader('Content-type', 'text/css');
                payloadString = typeof(payload) !== undefined? payload: '';
            }
            if (contentType === 'png') {
                debug('icon handling');
                res.setHeader('Content-type', 'image/png');
                payloadString = typeof(payload) !== undefined? payload: '';
            }
            if (contentType === 'jpg') {
                debug('icon handling');
                res.setHeader('Content-type', 'image/jpeg');
                payloadString = typeof(payload) !== undefined? payload: '';
            }
            if (contentType === 'plain') {
                debug('icon handling');
                res.setHeader('Content-type', 'text/plain');
                payloadString = typeof(payload) !== undefined? payload: '';
            }
            
            res.writeHead(status);
            res.end(payloadString);
            debug('return payload : ', status, payload);
        }).catch (err => {
            var status = err.status;
            var payload =  err.Error;
            debug('catch return payload : ', status, payload);
            status = typeof(status) === 'number'? status: 200;
            payload = typeof(payload) === 'string'? {'Error':payload}: {};
            res.setHeader('Content-type', 'application/json');
            res.writeHead(status);
            res.end(JSON.stringify(payload));
        });
    });

}

router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'myshopping/cart': handlers.shoppingcartList,
    'menu/menuList': handlers.menuList,
    'api/users' : handlers.users,
    'api/login' : handlers.login,
    'api/logout': handlers.logout,
    'api/menu': handlers.menu,
    'api/shoppingcart': handlers.shoppingcart,
    'api/checkout': handlers.checkout,
    'favicon.ico': handlers.favicon,
    'public' : handlers.public
}

httpServer = http.createServer(function(req, res) {
    unifiedServerHandling(req, res);
});

httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname, '/https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/https/cert.pem')),
};

httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServerHandling(req, res);
});

httpServer.listen(config.httpPort, function() {
    console.log('\x1b[36m%s\x1b[0m', `now i am listening on httpPort: ${config.httpPort}, mode: ${config.envName}`);
});

httpsServer.listen(config.httpsPort, function() {
    console.log('\x1b[35m%s\x1b[0m', `now i am listening on httpsPort: ${config.httpsPort}, mode: ${config.envName}`);
});