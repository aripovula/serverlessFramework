const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    console.log('event =', event);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const pollyS3id = event.candidateID;
    const params = {
        TableName: process.env.DB_TABLE_NAME
    };

    if (!pollyS3id || pollyS3id === '') {
        docClient.scan(params, (err, data) => {
            if (err) {
                // context.succeed({ success: false, error: err });
                callback(err);
            } else {
                // context.succeed({ success: true, data: data.Items });
                callback(null, data.Items);
            }
        });
    } else {
        params.Key = {
            "id": pollyS3id
        };
        docClient.get(params, (err, data) => {
            if (err) {
                // context.succeed({ success: false, error: err });
                callback(err);
            } else {
                // context.succeed({ success: true, data: data.Item });
                callback(null, data.Item);
            }
        });
    }
};