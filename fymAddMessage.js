const AWS = require('aws-sdk');
const uuid = require('uuid');

const docClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = (event, context, callback) => {
    const record = {
        id: event.candidateID + '-1ULA',
        text: event.text,
        voice: event.voice,
        status: 'PROCESSING'
    };

    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Item: record
    }

    docClient.put(params, (err, data) => {
        if (err) {
            // context.succeed({ success: false, error: err });
            callback(err);
        } else {
            sqs.sendMessage({
                MessageBody: record.id,
                QueueUrl: process.env.QUEUE_URL
            }, (err, data) => {
                if (err) {
                    // context.succeed({ success: false, error: err });
                    callback(err);
                } else {
                    // context.succeed({ success: true, data: record });
                    callback(null, record);
                }
            });
        }
    });
};