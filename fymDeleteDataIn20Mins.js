const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.handler = (event, context, callback) => {
    let fileName;
    console.log('event', event);
    const candidateID = event.candidateID;

    const bucketRek = process.env.BUCKET_REK;
    const bucketPolly = process.env.BUCKET_POLLY;
    const pollyTable = process.env.DB_TABLE_NAME;

    const id2del = candidateID.substring(0, candidateID.length - 4);
    console.log('id2del', id2del);

    let DynamoDbData;
    const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });

    const params = {
        TableName: process.env.DB_TABLE_NAME
    };

    return new Promise((resolve, reject) => {
        console.log('abcd = 0 ', new Date());
        dynamodb.scan(params, (err, data) => {
            if (err) {
                console.log('Dynamo get err = ', err);
            } else {
                DynamoDbData = data;

                // used async with for loop in first answer in
                // https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop

                // used SEQUENTIAL START defined here
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

                (async function loop() {
                    for (let i = 0; i < DynamoDbData.Items.length; i++) {

                        const nextID = DynamoDbData.Items[i].id.S;
                        console.log('nextID', nextID);
                        if (nextID.includes(id2del)) {
                            console.log('before sending 2 delete id2del = ', id2del);
                            const deleteFromS3 = await deleteS3Object(nextID + '.mp3', bucketPolly, i);
                            const deleteFromDynamoDB = await deleteDynamoDbObject(nextID, pollyTable, dynamodb, i);
                            console.log('deleteFromS3 =', deleteFromS3);
                            console.log('deleteFromDynamoDB =', deleteFromDynamoDB);
                        }
                        console.log('from Async i =', i);
                    }
                    
                    (async function loop() {
                        // there is always four images per each find-a-match request id
                        // every uploaded image is stored by the browser - in images array
                        // and can be viewed by user till first redirect.
                        // But in S3 images are written by value of currentStep variable
                        // (currentStep var runs up to 4 for image uploads - repeat uploads overwrite older (not accepted) ones)
                        // This is done because 2nd valid (accepted) and 4th valid (accepted) images
                        // are used for FaceMatching with 1st accepted image and not accepted images are not needed)
                        for (let i = 1; i < 5; i++) {
                            const nextID = id2del + i + 'ULA.jpg';
                            console.log('before sending 2 delete jpg nextID = ', nextID);
                            const deleteFromS3 = await deleteS3Object(nextID, bucketRek, i);
                            console.log('from Async i =', i);
                        }
                    })();
                })();
            }
        });
    });
}

const deleteS3Object = (fileName, bucket, i) => {
    return new Promise((resolve2, reject2) => {
        console.log('in 1nd promise');
        s3.deleteObject({
            Key: fileName,
            Bucket: bucket
        }, function (error, data) {
            if (error) {
                console.log("error deleting s3 obj = ", error);
                resolve2(error);
            } else {
                console.log("success deleting s3 obj i = ", i);
                resolve2(data);
            }
        });
    });
}

const deleteDynamoDbObject = (itemId, tableName, dynamodb, i) => {
    return new Promise((resolve3, reject3) => {
        console.log('in 2nd promise itemId = ', itemId);
        const params = {
            Key: {
                "id": {
                    S: itemId
                }
            },
            TableName: tableName
        };

        dynamodb.deleteItem(params, function (err, data) {
            if (err) {
                console.log('Error deleting DynamoDB item', err);
                resolve3(err);
            } else {
                console.log('Deleted from DynamoDB i - ', i);
                resolve3(data);
            }
        });
    });
}
