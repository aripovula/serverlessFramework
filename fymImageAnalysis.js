'use strict';

const ImageAnalyser = require('./imageAnalyser');

/**
  Analyse an image on S3 using bucket and image name
 */
module.exports.handler = (event, context, callback) => {
    const data = JSON.parse(event.body);

    const s3Config = {
        bucket: process.env.BUCKET_NAME,
        imageName: data.imageName,
    };

    return ImageAnalyser
        .getImageLabels(s3Config)
        .then((labels) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({ Labels: labels }),
            };
            callback(null, response);
        })
        .catch((error) => {
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: { 'Content-Type': 'text/plain' },
                body: error.message || 'Internal server error',
            });
        });
};