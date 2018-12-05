const request = require('request-promise');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.handler = (event, context, callback) => {
    var options = {
        uri: 'https://images.freeimages.com/images/small-previews/443/horse-1393073.jpg',
        encoding: null
    };
    request(options, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            console.log("failed to get image");
            console.log(error);
        } else {
            s3.putObject({
                Body: body,
                Key: 'fromURL.jpg',
                Bucket: 'dcf-dfym2c-rekognition'
            }, function (error, data) {
                if (error) {
                    console.log("error downloading image to s3");
                } else {
                    console.log("success uploading to s3");
                }
            });
        }
    });
}