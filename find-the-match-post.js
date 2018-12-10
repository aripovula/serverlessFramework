console.log('start-post');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
    console.log('event', event);
    const accessToken = event.accessToken;
    const cispParams = {
        "AccessToken": accessToken
    };

    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            const id = event.id;
            const userName = event.userName;
            const otherDetails = event.otherDetails;
            console.log('event', event);
            console.log('id', id);
            console.log('userName', userName);
            console.log('otherDetails', otherDetails);
            console.log('AWS', AWS === null);
            console.log('dynamodb', dynamodb === null);

            // callback(null, "Hi "+name+". Followings were recorded in DynamoDB "+interests);

            let params = {
                Item: {
                    "UserID": {
                        S: id
                    },
                    "userName": {
                        S: userName
                    },
                    "otherDetails": {
                        S: otherDetails
                    }
                },

                TableName: "dcf-dfym2c-usersTable"
            };

            dynamodb.putItem(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    callback(err);
                } else {
                    console.log(data);           // successful response

                    callback(null, data);
                }
            });
        }
    });
};
