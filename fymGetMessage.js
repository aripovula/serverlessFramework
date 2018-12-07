const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    const docClient = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: process.env.DB_TABLE_NAME
    };

    if (!event.noteId || event.noteId === '') {
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
            "id": event.noteId
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