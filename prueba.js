exports.handler = function(context, event, callback) {
console.log('invoked with', event);
global.twiml = new Twilio.twiml.MessagingResponse();
 
var https = require('follow-redirects').https;
var fs = require('fs');
var options = {
    'method': 'POST',
    'hostname': 'poctwliocai.cfapps.eu10.hana.ondemand.com',
    'path': '/ConectorTwilioCAI',
    'headers': {
        'Content-Type': 'application/json'
    },
    'maxRedirects': 20
};
 
 
var req = https.request(options, function (res) {
    var chunks = [];
 
    res.on("data", function (chunk) {
        chunks.push(chunk);
    });
 
    res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
 
        var data = body.toString();
    //data = 'texto de prueba';
        twiml.message(data);
        callback(null, twiml);
    });
 
    res.on("error", function (error) {
        console.error(error);
    });
});
 
var postData = JSON.stringify({ "message": { "content": event.Body, "type": "text" }, "conversation_id": event.From });
 
req.write(postData);
 
req.end();
 
// var data = event.From;
// twiml.message(data);
// callback(null, twiml);
  
};
 