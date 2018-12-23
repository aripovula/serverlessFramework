const AWS = require('aws-sdk');
const uuid = require('uuid');

const docClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = (event, context, callback) => {
    const record = {
        id: event.candidateID,
        text: event.text,
        voice: event.voice,
        status: 'PROCESSING'
    };
    console.log('event = ', event);
    console.log('record = ', record);
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
                    console.log('err = ', err);
                    // context.succeed({ success: false, error: err });
                    callback(err);
                } else {
                    console.log('data = ', data);
                    // context.succeed({ success: true, data: record });
                    callback(null, record);
                }
            });
        }
    });
};