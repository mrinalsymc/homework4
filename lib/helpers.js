const crypto = require('crypto');
const config = require('./config');
const https = require('https');
var queryString = require('querystring');
var path = require('path');
var fs = require('fs');
const util = require('util');
var debug = util.debuglog('helpers');

var helpers = {};

helpers.hash = function (str) {
    if (typeof(str) === 'string' && str.trim().length > 0) {
        return crypto.createHmac('sha512', config.hashSecret).update(str).digest('hex');
    }
    else {
        return  false;
    }
};

helpers.parseJsonStringToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    }
    catch (err) {
        console.log('error while parsing : ', str);
        return false;
    }
};

helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
        // Start the final string
        var str = '';
        for(i = 1; i <= strLength; i++) {
            // Get a random charactert from the possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the string
            str+=randomCharacter;
        }
        // Return the final string
        return str;
    } else {
        return false;
    }
};

//integrating with stripe
helpers.processPayment = (amountInCents, sourceToken) => {
    amountInCents = typeof(amountInCents) === 'number' && amountInCents > 0 ? amountInCents: false;
    sourceToken = typeof(sourceToken) === 'string' && sourceToken.trim().length > 0? sourceToken: false;
    if (amountInCents && sourceToken) {
        return new Promise((resolve, reject) => {
            var payload = {
                'amount' : amountInCents,
                'currency': config.stripe.currency,
                'description': config.stripe.description,
                'source': sourceToken
            };

            var stringPayload = queryString.stringify(payload);

            var requestDetails = {
                'protocol': 'https:',
                'hostname': 'api.stripe.com',
                'method': 'POST',
                'path': '/v1/charges',
                'auth': config.stripe.apiKey + ':',
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(stringPayload)
                }
            };

            //instantiate the request object
            var req = https.request(requestDetails, function(res) {
                var status = res.statusCode;

                if (status === 200 || status === 201) {
                    resolve(status);
                } 
                else {
                    console.log('got error: ', status);
                    reject(status, {'Error': 'some error'})
                }
            });

            req.on('error', function(e) {
                console.log('got error1', e);
                reject(500, {'Error': 'some errora'})
            });

            req.write(stringPayload);

            req.end();
        });
    }
    else {
        return Promise.reject({'status': 400, 'Error': 'Invalid/missing parameters'});
    }
}

//integrating with mailgun
helpers.sendEmail = (parsedUserObject, printableShoppingCart) => {
    var shoppingCart = typeof(printableShoppingCart) === 'object' && printableShoppingCart instanceof Array ? printableShoppingCart: [];
    if (shoppingCart) {
        return new Promise((resolve, reject) => {
            var payload = {
                'from' : config.mailgun.from,
                'to': parsedUserObject.email,
                'subject': config.mailgun.subject,
                'text': config.mailgun.msg.replace('first_name', parsedUserObject.name).replace('shopping_cart', JSON.stringify(shoppingCart, null, 2))
            };

            var stringPayload = queryString.stringify(payload);

            var requestDetails = {
                'protocol': 'https:',
                'hostname': 'api.mailgun.net',
                'method': 'POST',
                'path': '/v3/' + config.mailgun.server + '/messages',
                'auth': 'api:' + config.mailgun.apikey,
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(stringPayload)
                }
            };

            //instantiate the request object
            var req = https.request(requestDetails, function(res) {
                var status = res.statusCode;

                if (status === 200 || status === 201) {
                    resolve(status);
                } 
                else {
                    debug('got error: ', status);
                    reject(status, {'Error': 'some error'})
                }
            });

            req.on('error', function(e) {
                debug('in OnError:', e);
                reject(500, {'Error': 'some errora'})
            });

            req.write(stringPayload);

            req.end();
        });
    }
    else {
        return Promise.reject({'status': 400, 'Error': 'Invalid/missing parameters'});
    }
}

// get the string content of a template
helpers.getTemplate = (templateName, data) => {
    return new Promise((resolve, reject) => {
        templateName = typeof(templateName) === 'string' && templateName.trim().length > 0? templateName: false;
        data = typeof(data) == 'object' && data !== null ? data : {};
        if (templateName) {
            var templatesDir = path.join(__dirname, '/../templates/');
            fs.readFile(templatesDir + templateName + '.html', 'utf8', function(err, str) {
                if (!err && str && str.length > 0) {
                    var finalString = helpers.interpolate(str, data);
                    resolve(finalString);
                }
                else {
                    reject('No template could be found');
                }
            });
        }
        else {
            reject('A valid template name was not specified');
        }
    });
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = (str,data) => {
    return new Promise((resolve, reject) => {
        str = typeof(str) == 'string' && str.length > 0 ? str : '';
        data = typeof(data) == 'object' && data !== null ? data : {};
        // Get the header
        var header;
        helpers.getTemplate('_header', data)
        .then(headerString => {
            header = headerString;
            return helpers.getTemplate('_footer', data);
        })
        .then(footerString => {
            var fullString = header+str+footerString;
            resolve(fullString);
        }).catch(err => {
            reject(err);
        })
    });
    
};
  
//take a given string and a data object and find/replace all the keys within it
helpers.interpolate = function(str, data) {
    str = typeof(str) === 'string' && str.trim().length > 0? str: false;
    data = typeof(data) === 'object' && data != null? data: {};

    // add the templateGlobals to the data object, prepending their keyname with "global."
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] = config.templateGlobals[keyName]
        }
    }

    //debug('data: ', data);
                    

    // each key int he data object, insert its value into the string at the corresponding 
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) === 'string') {
            var replace = data[key];
            var find = "{" + key + "}";
            str = str.replace(find, replace); 
        }
    }
    return str;
}

//get the contents of a static asset
helpers.getStaticAsset = fileName => {
    return new Promise((resolve, reject) => {
        fileName = typeof(fileName) === 'string' && fileName.trim().length > 0? fileName: false;
        if (fileName) {
            var publicDir = path.join(__dirname, '/../public/');
            fs.readFile(publicDir + fileName, function(err, data) {
                if (!err && data) {
                    resolve(data);
                }
                else {
                    reject('No file could be found');
                }
            });
        }
        else {
            reject('A valid file name was not specified');
        }
    });
    
};

module.exports = helpers;
