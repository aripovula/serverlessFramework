const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
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
            const name = event.name;
            const gender = event.gender;
            const interests = event.interests;
            console.log('event', event);
            console.log('id', id);
            console.log('name', name);
            console.log('gender', gender);
            console.log('interests', interests);
            console.log('AWS', AWS === null);
            console.log('dynamodb', dynamodb === null);

            // callback(null, "Hi "+name+". Followings were recorded in DynamoDB "+interests);

            let params = {
                Item: {
                    "UserID": {
                        S: id
                    },
                    "name": {
                        S: name
                    },
                    "gender": {
                        S: gender
                    },
                    "interests": {
                        S: interests
                    }
                },

                TableName: "find-your-match"
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
