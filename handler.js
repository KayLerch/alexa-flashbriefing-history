'use strict';
const aws = require('aws-sdk');
const dateFormat = require('dateformat');
const uuidV4 = require('uuid/v4');
const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const weekdays = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

var s3 = new aws.S3();

module.exports.feed = (event, context, callback) => {
  var upDate = new Date();
  var thisYear = new Date().getFullYear(); // full year
  var resort = event.path.toString().replace('/', '');

    var params = {
      Bucket: 'io.klerch.alexa.once',
      Key: dateFormat(upDate, 'mm') + '/' + dateFormat(upDate, 'dd') + '/' + resort + '-' + dateFormat(upDate, 'mm-dd') + '.json'
    };
    s3.getObject(params, function(err, data) {
        var feeds = [];
        if (err) {
          console.log(err, err.stack);
        }
        else {
          var body = JSON.parse(data.Body);
          var years = Object.keys(body);
          var minutes = 0;
          var exactly = ['exakt','genau',''].sort(function() { return 0.5 - Math.random() } );
          var happened = ['Geschehen','Passiert','Ereignet'].sort(function() { return 0.5 - Math.random() } );
          // shuffle list and pick last three
          years.sort(function() { return 0.5 - Math.random() } ) // shuffle
               .slice(-3) // pick last three
               .sort(function(a,b) { return a - b } ) // sort by year 
               .reverse() // most recent events come first
               .forEach(function (year) {
                  var weekday = new Date(year, upDate.getMonth(), upDate.getDate()).getDay();
                  var dateStr = weekdays[weekday] + ' den ' + dateFormat(upDate, 'dd.') + months[upDate.getMonth()] + ' ' + year.replace('-', '') + (year.startsWith('-') ? ' vor Christus' : '');
                  var text = (resort == 'birthdays' ?
                      ("Geboren vor " + (thisYear - parseInt(year)) + " Jahren wurde " + body[year].text + ", am " + dateStr) :
                      (happened[minutes] + " vor " + exactly[minutes] + " " + (thisYear - parseInt(year)) + " Jahren, am " + dateStr + ". " + body[year].text));
                  // ensure unique update-timestamp
                  upDate.setMinutes(59 - minutes++);
                  var feed = {
                      uid: "urn:uuid:" + uuidV4(),
                      updateDate: upDate.toISOString(),
                      titleText: dateStr + ": " + body[year].title,
                      mainText: text,
                      redirectionUrl: body[year].link
                  };
                  feeds.push(feed);
              });
        }
        callback(null, {
            statusCode: 200,
            body: JSON.stringify(feeds)
        }); 
    });
};