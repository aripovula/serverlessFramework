const AWS = require('aws-sdk');
const Stream = require('stream')
const Fs = require('fs');

const convertTextToVoice = function (data, callback) {
    const polly = new AWS.Polly();

    var params = {
        OutputFormat: "mp3",
        SampleRate: "8000",
        Text: data.text,
        TextType: "text",
        VoiceId: data.voice
    };

    polly.synthesizeSpeech(params, callback);
}

const saveToS3 = function (postId, filePath, callback) {
    const S3 = new AWS.S3();
    const readStream = Fs.createReadStream(filePath);
    var params = {
        Bucket: process.env.BUCKET_NAME,
        Key: postId + ".mp3",
        Body: readStream,
        ACL: "public-read"
    };

    S3.upload(params, callback);
}

const deleteSQSMessage = function (receiptHandle) {
    const sqs = new AWS.SQS();
    sqs.deleteMessage({
        QueueUrl: process.env.SQS_URL,
        ReceiptHandle: receiptHandle
    });
}

const updateRecord = function (postId, status, url, callback) {
    const docClient = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Key: {
            "id": postId
        },
        UpdateExpression: "set #statusAtt = :s, #urlAtt=:u",
        ExpressionAttributeNames: {
            "#statusAtt": "status",
            "#urlAtt": "url"
        },
        ExpressionAttributeValues: {
            ":s": status,
            ":u": url
        }
    };

    docClient.update(params, callback);
}
exports.handler = (event, context, callback) => {
    var postId = event["Records"][0].body;
    var receiptHandle = event["Records"][0].receiptHandle;

    deleteSQSMessage(receiptHandle);

    console.log('Converting Post', postId);

    const docClient = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: process.env.DB_TABLE_NAME,
        Key: {
            "id": postId
        }
    };

    docClient.get(params, (err, data) => {
        if (err) {
            // context.succeed({ success: false, error: err });
            callback(err);
        } else {
            console.log('Converting Text', data.Item.text, 'to voice', data.Item.voice);

            convertTextToVoice(data.Item, (err, data) => {
                if (err) {
                    // context.succeed({ success: false, error: err });
                    callback(err);
                } else {
                    if (data.AudioStream instanceof Buffer) {
                        const filePath = "/tmp/" + postId + ".mp3";

                        Fs.writeFile(filePath, data.AudioStream, function (err) {
                            if (err) {
                                // context.succeed({ success: false, error: err });
                                callback(err);
                            } else {
                                console.log('File ready to upload', filePath);

                                saveToS3(postId, filePath, (err, data) => {
                                    if (err) {
                                        // context.succeed({ success: false, error: err });
                                        callback(err);
                                    } else {
                                        updateRecord(postId, 'READY', data.Location, (err, data) => {
                                            if (err) {
                                                // context.succeed({ success: false, error: err });
                                                callback(err);
                                            } else {
                                                // context.succeed({ success: true, data: data });
                                                callback(null, data);
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                }
            });
        }
    });
};