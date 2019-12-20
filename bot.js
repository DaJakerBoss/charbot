var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var nedb = require('nedb');

//config vars
commandString = '/';

//vars
uwuCount = 0;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize neDB for persistent storage
db = new nedb({ filename: './data.db', autoload: true });

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    if (user != 'charbot') {

        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.substring(0, commandString.length) == commandString) {
            logger.info('message header received from ' + user + ' : ' + userID + ', with command string ' + message.substring(0, commandString.length));
            var args = message.substring(commandString.length).split(' ');
            var cmd = args[0];

            args = args.splice(1);
            switch (cmd) {
                // !ping
                case 'ping':
                    bot.sendMessage({
                        to: channelID,
                        message: 'Pong!'
                    });
                    break;
                // Just add any case commands if you want to..
                case 'uwu':
                    //check for arguments
                    switch (args[0]) {
                        case 'all':
                            bot.sendMessage({
                                to: channelID,
                                message: uwuCount + ' uwus recorded by all'
                            });
                            break;
                        default:
                            db.findOne({ user_id: userID }, function(err, doc) {
                                //docs contains user row
                                if (doc != null) {
                                    logger.info(doc);
                                    bot.sendMessage({
                                        to:channelID,
                                        message: doc.uwu_count + ' uwus said by you'
                                    });
                                } else {
                                    db.insert({ user_id: userID, uwu_count: 0}, function(err) {});
                                    logger.info('No document found, created document');
                                    bot.sendMessage({
                                        to:channelID,
                                        message: doc.uwu_count + '0 uwus said by you'
                                    });
                                    //userUwuCount = doc.uwu_count;
                                    //db.update({ user_id: userID }, { $set: {uwu_count: userUwuCount }}, )
                                }
                            });
                            break;
                    }
                    break;
                case 'config':
                    switch (args[0]) {
                        case 'list':
                            bot.sendMessage({
                                to: channelID,
                                message: 'All available config options:\npromptChars : set the string used to call charbot'
                            });
                            break;
                        case 'promptChars':
                            commandString = args[1];
                            bot.sendMessage({
                                to:channelID,
                                message: 'Updated promptChars to ' + commandString
                            });
                            break;
                    }
                    break;
            }
        } else {
            // If the message contains no commandString then

            if (message.includes('uwu')) {
                logger.info('found uwu, logging');
                // Count uwus
                msgUwuCount = occurrences(message, 'uwu'); // set uwu count for the current message
                uwuCount += msgUwuCount; // add to global uwu count

                // Count user uwus
                db.findOne({ user_id: userID }, function(err, doc) {
                    //docs contains user row
                    if (doc != null) {
                        // if document exists
                        userUwuCount = doc.uwu_count + msgUwuCount;
                        db.update({ user_id: userID }, { $set: {uwu_count: userUwuCount } });
                    } else {
                        // if no document exists, create one
                        db.insert({ user_id: userID, uwu_count: msgUwuCount }, function(err) {
                            logger.info('No document found, created document');
                        });
                    }
                });
                // log updated document
                db.findOne({ user_id: userID }, function(err, doc) {
                    logger.info(doc);
                });
            }
        }
    }
});

function occurrences(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}
