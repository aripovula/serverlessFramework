
'use strict';
let https = require("https");
let http = require("http");
let AWS = require('aws-sdk');
let ses = new AWS.SES();

exports.handler = (event, context, callback) => {
    console.log(event);
    // const data = JSON.parse(event);

  const params = {
    Destination: {
      ToAddresses: [ "ulugbeks@gmail.com" ],
    },
    Message: {
      Subject: {
        Data: "ABC TesT", //data.subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: "test Data", // data.text,
          Charset: "UTF-8"
        }
      }
    },
    Source: "ulugbek@aripov.com"
  };

  ses.sendEmail(params, function(err) {
    console.log('error = ', err);
    if (err) {
    callback(err);
    } else {
    callback(null, {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ status: "success" })
    
    });
    }
  })
};