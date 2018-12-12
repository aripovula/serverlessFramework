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

                    getImageDescription(fileName, callback);
                }
            });
        }
    });
}

const getImageDescription = function (fileName, callback) {

    return new Promise((resolve, reject) => {


        // console.log(`Analyzing file: https://s3.amazonaws.com/${params.Image.S3Object.Bucket}/${params.Image.S3Object.Name}`);

        return getLabels(fileName)
            .then((data) => {
                return getFaceInfo(fileName, data);
            })
            .then((data) => {
                return getCelebrityInfo(fileName, data);
            })
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

const getFaceInfo = function (fileName, prevData) {

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

            const rekogData = {
                labelsData: prevData,
                faceData: data.FaceDetails
            }

            return resolve(rekogData);
        });
    });
}

const getCelebrityInfo = function (fileName, prevData) {

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

            const rekogData = {
                labelsData: prevData.labelsData,
                faceData: prevData.faceData,
                celebrityData: data.CelebrityFaces
            }

            return resolve(rekogData);
        });
    });
}