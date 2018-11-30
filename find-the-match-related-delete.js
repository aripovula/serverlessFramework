const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
    const accessToken = event.accessToken;
    const candidateID = event.candidateID;
    console.log('candidateID = ', candidateID);
    const params = {
        Key: {
            "UserID": {
                S: candidateID
            }
        },
        TableName: 'find-your-match'
    };
    const cispParams = {
        "AccessToken": accessToken
    };
    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            // I don't use user ID here - I want to make sure that passed token is valid to
            // prevent someone else deleting anything in Dynamo DB.

            dynamodb.deleteItem(params, function (err, data) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log(data);
                    callback(null, data);
                }
            });

        }

    });


};
