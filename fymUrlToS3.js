const request = require('request-promise');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ImageAnalyser = require('./imageAnalyser');

const analyzeImage = function (fileName, callback) {
    const s3Config = {
        bucket: process.env.BUCKET_NAME,
        imageName: fileName,
    };

    return ImageAnalyser
        .getImageLabels(s3Config)
        .then((labels) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    Labels: labels
                }),
            };
            callback(null, response);
        })
        .catch((error) => {
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: error.message || 'Internal server error',
            });
        });
}

const putToS3FromURL = function (fileName, theURL, callback) {
    var options = {
        uri: theURL, // 'https://images.freeimages.com/images/small-previews/443/horse-1393073.jpg',
        encoding: null
    };
    request(options, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            console.log("failed to get image");
            console.log(error);
        } else {
            console.log('body = ', body);
            s3.putObject({
                Body: body,
                Key: 'fromURL.jpg',
                Bucket: 'dcf-dfym2c-rekognition'
            }, function (error, data) {
                if (error) {
                    console.log("error downloading image to s3");
                } else {
                    console.log("success uploading to s3");

                    analyzeImage(fileName, callback);
                }
            });
        }
    });
}

module.exports.handler = (event, context, callback) => {
    let fileName;
    const type = event.type;
    const theURL = decodeURIComponent(event.imageUrl);
    console.log('theURL = ', theURL);

    console.log('type = ', type);
    if (type === "1") putToS3FromURL('fromURL.jpg', theURL, callback);
    if (type === "2") analyzeImage('fromLocal.jpg', callback);

}