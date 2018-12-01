/**
 * These are cli related tasks
 */

 //dependencies
 var readline = require('readline');
 var util = require('util');
 var debug = util.debuglog('cli');
 var events = require('events');
 var os = require('os');
 var v8 = require('v8');
 var _data = require('./data');
 var helpers = require('./helpers');

 class _events extends events{};
 var e = new _events();

 //Instantiate the CLI module object
 var cli = {};

 //input handlers
 e.on('man', function(str) {
    cli.responders.help();
 });

 e.on('help', function(str) {
    cli.responders.help();
 });

 e.on('exit', function(str) {
    cli.responders.exit();
 });

 e.on('menu', function(str) {
    cli.responders.menu();
 });

 e.on('list users', function(str) {
    cli.responders.listUsers(str);
 });

 e.on('more user info', function(str) {
    cli.responders.moreUserInfo(str);
 });

 e.on('list orders', function(str) {
    cli.responders.listOrders(str);
 });

 e.on('more order info', function(str) {
    cli.responders.moreOrderInfo(str);
 });

 //responders
 cli.responders = {};

 // help/man 
 cli.responders.help = function() {
   var commands = {
      'exit': 'Kill the CLI (and the rest of the application)',
      'man': 'Show this help page',
      'help': 'Alias of the man commands',
      'menu': 'List the available menu',
      'list orders --{timeOffsetInHours}': 'show the list of all orders in the system. --{timeOffsetInHours} is optional. pass it to see orders only in the last {timeOffsetInHours} period',
      'more order info --{orderId}': 'show details of a specific order',
      'list users --{timeOffsetInHours}': 'show a list of all the active users in the system--{timeOffsetInHours} is optional. pass it to see users who signed up only in the last {timeOffsetInHours} period',
      'more user info --{userId}': 'show details of a specific user'
   };

   //show a header for the help page that is as wide as the screen
   cli.horizontalLine();
   cli.centered('CLI MANUAL');
   cli.horizontalLine();
   cli.verticalSpace(2);

   //show each commands, followed by its explanation, in white and yellow resp
   for (key in commands) {
      if (commands.hasOwnProperty(key)) {

         //console.log('\x1b[34m%s\x1b[0m', `The CLI is running:`);
         var value = commands[key];
         line = '\x1b[33m'+key+'\x1b[0m';
         var padding = 60 - line.length;
         for(i = 0; i< padding; i++) {
            line+=' ';
         }
         line+=value;
         console.log(line);
         cli.verticalSpace();
      }
   }
   cli.verticalSpace(1);

   //end with another horizontal line
   cli.horizontalLine();
 };

 cli.responders.exit = function() {
    console.log('bye bye!!');
    process.exit(0);
 };

 cli.verticalSpace = function(lines) {
    lines  = typeof(lines) === 'number' && lines > 0? lines: 1;
    for (i = 0; i < lines; i++) {
      console.log('');
    }
 }

 cli.horizontalLine = function() {
   //get the available screen size
   var width = process.stdout.columns;
   var line = ''
   for (i = 0; i < width; i++) {
      line += '-';
   }
   console.log(line);
}

cli.centered = function(str) {
   //get the available screen size
   str  = typeof(str) === 'string' && str.trim().length > 0? str.trim(): '';
   var width = process.stdout.columns;
   var leftPadding = Math.floor((width - str.length)/2);

   //put left padded spaces
   var line = ''
   for (i = 0; i < leftPadding; i++) {
      line += ' ';
   }
   line+=str;
   console.log(line);
}

cli.responders.menu = function() {
    console.log('you called menu');
};

cli.responders.listUsers = function(str) {
    console.log('you called list users: ', str);
    /*_data.list('users').then(userIds => {
       cli.verticalSpace();
       userIds.forEach(userId => {
         _data.read('users', userId, function(err, userData) {
            if (!err && userData) {
               var line = `Name : ${userData.firstName + ' ' + userData.lastName} Phone: ${userData.phoneNumber} Checks: `;
               var numberOfchecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array && userData.checks.length > 0? userData.checks.length: 0;
               line += numberOfchecks;
               console.log(line);
               cli.verticalSpace();
            }
         });
       });
    }).catch (err => {

    });*/
};

cli.responders.moreUserInfo = function(str) {
    console.log('you called more user info: ', str);
    //get the ID from the str
    /*var arr = str.split('--');
    var userId = typeof(arr[1]) === 'string' && arr[1].trim().length? arr[1].trim(): false;

    if (userId) {
       _data.read('users', userId, function (err, userData) {
         if (!err && userData) {
            //remove the hashed password
            delete userData.password;

            //print the json with text highlighting
            cli.verticalSpace();
            console.dir(userData, {'colors': true});
            cli.verticalSpace();
         }
       });
    }*/
};

cli.responders.listOrders = function(str) {
    console.log('you called list orders: ', str);
   /*_data.list('checks').then(checkIds => {
      cli.verticalSpace();
      checkIds.forEach(checkId => {
         _data.read('checks', checkId, function(err, checkData) {
            if (!err && checkData) {
               var lowerString = str.toLowerCase();
               var state = typeof(checkData.state) == 'string'? checkData.state: 'down';

               var stateOrUnknown = typeof(checkData.state) == 'string'? checkData.state: 'unknown';

               //if the user has specifed the state or hasnt specified the state, include the current state accordingly
               if ((lowerString.indexOf('--'+state) > -1) || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)) {
                  var line = `ID : ${checkData.id} ,METHOD: ${checkData.method.toUpperCase()} ,url: ${checkData.protocol + '://' + checkData.url} ,State: ${stateOrUnknown}`;
                  console.log(line);
                  cli.verticalSpace();
               }
            }
         });
       });
   })*/

};

cli.responders.moreOrderInfo = function(str) {
    console.log('you called more order info: ', str);
    //get the ID from the str
    /*var arr = str.split('--');
    var checkId = typeof(arr[1]) === 'string' && arr[1].trim().length? arr[1].trim(): false;

    if (checkId) {
       _data.read('checks', checkId, function (err, checkData) {
         if (!err && checkData) {
            //print the json with text highlighting
            cli.verticalSpace();
            console.dir(checkData, {'colors': true});
            cli.verticalSpace();
         }
       });
    }*/
};


 cli.processInput = function(str) {
     str = typeof(str) == 'string' && str.trim().length > 0? str.trim(): false;

     //only process the input if the user actually wrote something
     if (str) {
         //codify the unique strings that identity the unique questions
         var uniqueInputs = [
             'man',
             'help',
             'exit',
             'menu',
             'list orders',
             'more order info',
             'list users',
             'more user info'
         ];

         //go through the possible inputs and emit an events when a match is found
         var matchFound = false;
         var counter = 0;
         uniqueInputs.some(function(input) {
             if (str.toLowerCase().indexOf(input) > -1) {
                 matchFound = true;

                 //emit an event matching the unique input and include the full string
                 e.emit(input, str);

                 return true;
             }
         });

         if (!matchFound){
             console.log('sorry try again');
         }

     }

 };

 cli.init = function() {
     //send the start message to the console in dark blue
     console.log('\x1b[34m%s\x1b[0m', `The CLI is running:`);

     //lets start the interface
     var _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>'
     });

     //create an initial prompt
     _interface.prompt();

     //handle each line of input seperately
     _interface.on('line', function(str) {
        //send it to the input processor
        cli.processInput(str);

        //reinitialize the promptafterwards
        _interface.prompt();
     });

     //if the user starts the cli. kill the associated process
     _interface.on('close', function() {
         process.exit(0);
     })
 }

 


 module.exports = cli;