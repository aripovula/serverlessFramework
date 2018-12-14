const request = require('request-promise');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const rek = new AWS.Rekognition();


module.exports.handler = (event, context, callback) => {
    let fileName;
    console.log('event', event);
    const type = event.type;
    const theURL = decodeURIComponent(event.imageUrl);
    console.log('theURL = ', theURL);

    console.log('type = ', type);
    if (type === "1") putToS3FromURL('fromURL.jpg', theURL, callback);
    if (type === "2") getImageDescription('fromLocal.jpg', callback);

}

const putToS3FromURL = function (fileName, theURL, callback) {
    var options = {
        uri: theURL,
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

                    getImageDescription(fileName, callback);
                }
            });
        }
    });
}

const getImageDescription = function (fileName, callback) {

    Promise.all([
        getLabels(fileName),
        getFaceInfo(fileName),
        getCelebrityInfo(fileName),
        getCompareFaceInfo(fileName)
    ])
        .then((data) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    Labels: data
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

const getLabels = function (fileName) {

    const params = {
        Image: {
            S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: fileName
            },
        },
        MaxLabels: 20,
        MinConfidence: 50,
    };

    return new Promise((resolve, reject) => {
        rek.detectLabels(params, (err, data) => {
            if (err) {
                return reject(new Error(err));
            }
            console.log('Analysis labels:', data.Labels);
            return resolve(data.Labels);
        });
    });
}

const getFaceInfo = function (fileName) {

    const params = {
        Image: {
            S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: fileName
            },
        },
        "Attributes": [
            "ALL"
        ]
    };

    return new Promise((resolve, reject) => {
        rek.detectFaces(params, (err, data) => {
            if (err) {
                return reject(new Error(err));
            }
            console.log('Analysis face: ', data.FaceDetails);

            return resolve(data.FaceDetails);
        });
    });
}

const getCelebrityInfo = function (fileName) {

    const params = {
        Image: {
            S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: fileName
            }
        }
    };

    return new Promise((resolve, reject) => {
        rek.recognizeCelebrities(params, (err, data) => {
            if (err) {
                return reject(new Error(err));
            }
            console.log('Analysis face: ', data.CelebrityFaces);

            return resolve(data.CelebrityFaces);
        });
    });
}

const getCompareFaceInfo = function (fileName) {

    const params = {
        SimilarityThreshold: 80,
        SourceImage: {
            S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: fileName
            }
        },
        TargetImage: {
            S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: 'fromLocal.jpg'
            }
        }
    };

    return new Promise((resolve, reject) => {
        rek.compareFaces(params, (err, data) => {
            if (err) {
                return reject(new Error(err));
            }
            console.log('Analysis face: ', data.FaceMatches);

            return resolve(data.FaceMatches);
        });
    });
}