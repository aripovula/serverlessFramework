const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.handler = (event, context, callback) => {
    let fileName;
    console.log('event', event);
    // const candidateID = event.candidateID;

    const bucketRek = 'dcf-dfym2c-rekognition';
    const bucketPolly = 'dcf-dfym2c-polly';
    const pollyTable = 'dcf-dfym2c-pollyTable';
    const candidateID = '91a3ccbe-544f-ac06-5bea-5a7ab72febb4-0ULA';

    const id2del = candidateID.substring(0, candidateID.length - 4);
    console.log('id2del', id2del);

    let DynamoDbData;
    const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });

    const params = {
        TableName: process.env.DB_TABLE_NAME
    };

    dynamodb.scan(params, (err, data) => {
        if (err) {
            console.log('Dynamo get err = ', err);
        } else {
            DynamoDbData = data;
            // console.log('Dynamo get success = ', DynamoDbData);
            console.log('Dynamo get ID = ', DynamoDbData.Items[0].id.S);

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
                        const deleteFromS3 = await deleteS3Object(nextID, bucketPolly, i);
                        const deleteFromDynamoDB = await deleteDynamoDbObject(nextID, pollyTable, i);
                        console.log('deleteFromS3 =', deleteFromS3);
                        console.log('deleteFromDynamoDB =', deleteFromDynamoDB);
                    }
                    console.log('from Async i =', i);
                }
            })();
        }
    });
}

const deleteS3Object = (itemId, bucket, i) => {
    return new Promise((resolve2, reject2) => {
        console.log('in 1nd promise');
        s3.deleteObject({
            Key: itemId + '.mp3',
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

const deleteDynamoDbObject = (itemId, tableName, i) => {
    return new Promise((resolve3, reject3) => {

        console.log('in 2nd promise itemId = ', itemId);
        console.log('in 2nd promise bucket = ', tableName);

        const params = {
            Key: {
                "id": {
                    S: itemId
                }
            },
            TableName: tableName
        };

        const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });

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