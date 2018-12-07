const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

module.exports.handler = (event, context, callback) => {
    console.log('event = ', event);
    let image = JSON.parse(event.image.image);
    const accessToken = event.accessToken;

    const cispParams = {
        "AccessToken": accessToken
    };

    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            if (image == null) {
                console.log("failed to get image");
            } else {
                console.log('IN ELSE image = ', image);

                const buf = new Buffer(image._imageAsDataUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64')
                const data = {
                    Key: 'fromLocal.jpg',
                    Body: buf,
                    ContentEncoding: 'base64',
                    ContentType: 'image/jpeg',
                    Bucket: process.env.BUCKET_NAME
                };
                s3.putObject(data, function (error, data) {
                    if (error) {
                        console.log("error putting to s3 - error", error);
                        callback({ success: false, error: err });
                    } else {
                        console.log("success uploading to s3");
                        callback(null, { success: true, data: data });
                    }
                });
            }
        }
    });
}